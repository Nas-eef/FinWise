-- ============================================================
-- 002_rls_policies.sql
-- Enforce Row Level Security (RLS) across all user tables
-- ============================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. ACCOUNTS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
    ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
    ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
    ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- 3. CATEGORIES (Allows system defaults with NULL user_id or user's custom categories)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default and own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (user_id = auth.uid());

-- 4. TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 5. TRANSFERS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers"
    ON public.transfers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers"
    ON public.transfers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. BUDGETS & BUDGET CATEGORIES
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage budget categories via budget ownership"
    ON public.budget_categories FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.budgets
        WHERE budgets.id = budget_categories.budget_id
        AND budgets.user_id = auth.uid()
    ));

-- 7. SAVINGS GOALS & CONTRIBUTIONS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals"
    ON public.savings_goals FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings contributions"
    ON public.savings_contributions FOR ALL
    USING (auth.uid() = user_id);

-- 8. LOANS, INSTALLMENTS & PAYMENTS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loans"
    ON public.loans FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loan installments"
    ON public.loan_installments FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loan payments"
    ON public.loan_payments FOR ALL
    USING (auth.uid() = user_id);

-- 9. RECURRING PAYMENTS & REMINDERS
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring payments"
    ON public.recurring_payments FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
    ON public.reminders FOR ALL
    USING (auth.uid() = user_id);

-- 10. RECEIVABLES & PAYABLES & REPAYMENTS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own receivables"
    ON public.receivables FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payables"
    ON public.payables FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.debt_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debt repayments"
    ON public.debt_repayments FOR ALL
    USING (auth.uid() = user_id);

-- 11. ATTACHMENTS, NOTIFICATIONS & USER SETTINGS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attachments"
    ON public.attachments FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and insert own sync queue"
    ON public.sync_queue FOR ALL
    USING (auth.uid() = user_id);

