-- Migration: Add user_notes table for persistent notes & reminders
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.user_notes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_date
  ON public.user_notes (user_id, date DESC);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_notes" ON public.user_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_notes" ON public.user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_notes" ON public.user_notes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_notes" ON public.user_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_user_notes_updated_at ON public.user_notes;
CREATE TRIGGER trg_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
