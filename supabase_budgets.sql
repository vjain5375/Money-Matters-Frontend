-- Run this in Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor

CREATE TABLE IF NOT EXISTS budgets (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    "limit"     NUMERIC(10,2) NOT NULL DEFAULT 0,
    month       INTEGER NOT NULL,   -- 1-12
    year        INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate budget per user per category per month
CREATE UNIQUE INDEX IF NOT EXISTS budgets_unique
    ON budgets (user_id, category, month, year);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own budgets
CREATE POLICY "Users manage own budgets"
    ON budgets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
