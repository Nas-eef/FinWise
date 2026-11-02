-- ============================================================
-- 005_expense_groups.sql
-- Expense Groups / Purposes & Linkage to Transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expense_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Folder',
    color VARCHAR(30) DEFAULT '#26A69A',
    budget NUMERIC(14,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for expense_groups
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expense groups"
    ON public.expense_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense groups"
    ON public.expense_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense groups"
    ON public.expense_groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense groups"
    ON public.expense_groups FOR DELETE
    USING (auth.uid() = user_id);

-- Add group_id to transactions if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'group_id'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN group_id UUID REFERENCES public.expense_groups(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON public.transactions(group_id);
    END IF;
END $$;

