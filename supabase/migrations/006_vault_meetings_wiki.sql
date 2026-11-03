-- ============================================================
-- 006_vault_meetings_wiki.sql
-- Document Vault, Meeting & Follow-up Manager, and Personal Wiki
-- ============================================================

-- 1. DOCUMENT VAULT
CREATE TABLE IF NOT EXISTS public.document_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    labels JSONB DEFAULT '[]'::jsonb,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    notes TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_vault_user_id ON public.document_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_category ON public.document_vault(category);

ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
    ON public.document_vault FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON public.document_vault FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON public.document_vault FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON public.document_vault FOR DELETE
    USING (auth.uid() = user_id);


-- 2. MEETINGS & FOLLOW-UP MANAGER
CREATE TABLE IF NOT EXISTS public.meetings_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(150),
    contact_role VARCHAR(150),
    followup_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    priority VARCHAR(50) DEFAULT 'medium',
    location VARCHAR(255),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_followups_user_id ON public.meetings_followups(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_followups_date ON public.meetings_followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_meetings_followups_status ON public.meetings_followups(status);

ALTER TABLE public.meetings_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
    ON public.meetings_followups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
    ON public.meetings_followups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
    ON public.meetings_followups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
    ON public.meetings_followups FOR DELETE
    USING (auth.uid() = user_id);


-- 3. PERSONAL WIKI & KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS public.personal_wiki (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    tags JSONB DEFAULT '[]'::jsonb,
    content TEXT NOT NULL DEFAULT '',
    is_pinned BOOLEAN DEFAULT false,
    color VARCHAR(30) DEFAULT '#242E25',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_wiki_user_id ON public.personal_wiki(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_wiki_category ON public.personal_wiki(category);
CREATE INDEX IF NOT EXISTS idx_personal_wiki_pinned ON public.personal_wiki(is_pinned);

ALTER TABLE public.personal_wiki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wiki articles"
    ON public.personal_wiki FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wiki articles"
    ON public.personal_wiki FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wiki articles"
    ON public.personal_wiki FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wiki articles"
    ON public.personal_wiki FOR DELETE
    USING (auth.uid() = user_id);

