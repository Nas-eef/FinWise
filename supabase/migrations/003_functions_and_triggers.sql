-- ============================================================
-- 003_functions_and_triggers.sql
-- Financial posting, balance reconciliation & auth automation
-- ============================================================

-- Function 1: Automatically create Profile & Settings on Supabase user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id, currency, date_format)
    VALUES (NEW.id, 'INR', 'DD/MM/YYYY')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function 2: Atomic Transaction Balance Poster (Trigger Function)
CREATE OR REPLACE FUNCTION public.apply_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC(14,2) := 0.00;
BEGIN
    -- Handle DELETE
    IF (TG_OP = 'DELETE') THEN
        IF OLD.account_id IS NOT NULL THEN
            IF OLD.transaction_type = 'expense' THEN
                v_diff := OLD.amount; -- Restore balance
            ELSE
                v_diff := -OLD.amount; -- Deduct income/refund
            END IF;
            UPDATE public.accounts
            SET current_balance = current_balance + v_diff,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;

    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.account_id IS NOT NULL AND NEW.deleted_at IS NULL THEN
            IF NEW.transaction_type = 'expense' THEN
                v_diff := -NEW.amount;
            ELSE
                v_diff := NEW.amount;
            END IF;
            UPDATE public.accounts
            SET current_balance = current_balance + v_diff,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE
    IF (TG_OP = 'UPDATE') THEN
        -- If old transaction was not soft-deleted, reverse it
        IF OLD.deleted_at IS NULL AND OLD.account_id IS NOT NULL THEN
            IF OLD.transaction_type = 'expense' THEN
                UPDATE public.accounts
                SET current_balance = current_balance + OLD.amount, updated_at = NOW()
                WHERE id = OLD.account_id;
            ELSE
                UPDATE public.accounts
                SET current_balance = current_balance - OLD.amount, updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        END IF;

        -- If new transaction is not soft-deleted, apply it
        IF NEW.deleted_at IS NULL AND NEW.account_id IS NOT NULL THEN
            IF NEW.transaction_type = 'expense' THEN
                UPDATE public.accounts
                SET current_balance = current_balance - NEW.amount, updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSE
                UPDATE public.accounts
                SET current_balance = current_balance + NEW.amount, updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_apply_transaction_balance ON public.transactions;
CREATE TRIGGER trigger_apply_transaction_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_balance();


-- Function 3: Atomic Money Transfer Between Accounts
CREATE OR REPLACE FUNCTION public.execute_account_transfer(
    p_user_id UUID,
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount NUMERIC(14,2),
    p_transfer_date DATE DEFAULT CURRENT_DATE,
    p_description TEXT DEFAULT 'Internal Account Transfer'
)
RETURNS UUID AS $$
DECLARE
    v_transfer_id UUID;
    v_from_user UUID;
    v_to_user UUID;
BEGIN
    IF p_from_account_id = p_to_account_id THEN
        RAISE EXCEPTION 'Cannot transfer to the same account.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive.';
    END IF;

    -- Verify ownership
    SELECT user_id INTO v_from_user FROM public.accounts WHERE id = p_from_account_id;
    SELECT user_id INTO v_to_user FROM public.accounts WHERE id = p_to_account_id;

    IF v_from_user IS NULL OR v_to_user IS NULL OR v_from_user <> p_user_id OR v_to_user <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized account transfer. Accounts must belong to authenticated user.';
    END IF;

    -- Decrement Source Account
    UPDATE public.accounts
    SET current_balance = current_balance - p_amount, updated_at = NOW()
    WHERE id = p_from_account_id;

    -- Increment Destination Account
    UPDATE public.accounts
    SET current_balance = current_balance + p_amount, updated_at = NOW()
    WHERE id = p_to_account_id;

    -- Insert Transfer Record
    INSERT INTO public.transfers (user_id, from_account_id, to_account_id, amount, transfer_date, description)
    VALUES (p_user_id, p_from_account_id, p_to_account_id, p_amount, p_transfer_date, p_description)
    RETURNING id INTO v_transfer_id;

    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function 4: Complete Account Balance Reconciliation
CREATE OR REPLACE FUNCTION public.reconcile_account_balance(p_account_id UUID)
RETURNS NUMERIC(14,2) AS $$
DECLARE
    v_opening NUMERIC(14,2) := 0.00;
    v_income NUMERIC(14,2) := 0.00;
    v_expenses NUMERIC(14,2) := 0.00;
    v_transfers_in NUMERIC(14,2) := 0.00;
    v_transfers_out NUMERIC(14,2) := 0.00;
    v_final_balance NUMERIC(14,2) := 0.00;
BEGIN
    SELECT opening_balance INTO v_opening FROM public.accounts WHERE id = p_account_id;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_income
    FROM public.transactions
    WHERE account_id = p_account_id AND transaction_type IN ('income', 'refund') AND deleted_at IS NULL;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_expenses
    FROM public.transactions
    WHERE account_id = p_account_id AND transaction_type = 'expense' AND deleted_at IS NULL;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfers_in
    FROM public.transfers
    WHERE to_account_id = p_account_id;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfers_out
    FROM public.transfers
    WHERE from_account_id = p_account_id;

    v_final_balance := v_opening + v_income - v_expenses + v_transfers_in - v_transfers_out;

    UPDATE public.accounts
    SET current_balance = v_final_balance, updated_at = NOW()
    WHERE id = p_account_id;

    RETURN v_final_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

