-- 005: Center codes for admins + Employee IDs (XMP-{CENTER}59{SEQ})
-- Each admin gets a 3-letter center_code assigned by super_admin (developer).
-- Each employee created by that admin gets employee_code = XMP-{CENTER}59{SEQ}.

-- Add center_code to users (for admin users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS center_code CHAR(3),
  ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES public.users(id);

-- Add employee_code to employee_profiles
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE;

-- Center sequence tracker — stores the next sequential number per center
CREATE TABLE IF NOT EXISTS public.center_sequences (
  center_code CHAR(3) PRIMARY KEY,
  next_seq    INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function: get next employee code for a center (atomic increment)
CREATE OR REPLACE FUNCTION public.next_employee_code(p_center CHAR(3))
RETURNS TEXT AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  -- Upsert: insert if not exists, increment if exists
  INSERT INTO public.center_sequences (center_code, next_seq)
  VALUES (p_center, 2)
  ON CONFLICT (center_code)
  DO UPDATE SET next_seq = public.center_sequences.next_seq + 1,
                updated_at = NOW()
  RETURNING next_seq - 1 INTO v_seq;

  -- Format: XMP-{CENTER}59{3-digit seq}
  RETURN 'XMP-' || p_center || '59' || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Unique constraint on center_code for admin users (one admin per center)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_center_code
  ON public.users(center_code) WHERE center_code IS NOT NULL;

-- Index for employee_code lookups
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_code
  ON public.employee_profiles(employee_code) WHERE employee_code IS NOT NULL;

-- Super admin role value
-- We add 'super_admin' to the user_role enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;
