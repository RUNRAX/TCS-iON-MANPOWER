-- 006_fix_table_alias.sql
-- Idempotent migration: ensures shift_assignments table exists with correct schema.
-- Safe to re-run — all statements use IF EXISTS / IF NOT EXISTS guards.

-- Step 1: Rename only if the old name still exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_shift_assignments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shift_assignments')
  THEN
    ALTER TABLE public.employee_shift_assignments RENAME TO shift_assignments;
    RAISE NOTICE 'Renamed employee_shift_assignments → shift_assignments';
  ELSE
    RAISE NOTICE 'Table already named shift_assignments (or old table not found). Skipping rename.';
  END IF;
END $$;

-- Step 2: Ensure required columns exist
ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS duty_role TEXT,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Add check constraint on duty_role (drop first if exists to avoid conflict)
DO $$
BEGIN
  ALTER TABLE public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_duty_role_check;
  ALTER TABLE public.shift_assignments
    ADD CONSTRAINT shift_assignments_duty_role_check
    CHECK (duty_role IS NULL OR duty_role IN ('Invigilation','Biometric','Registration'));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'duty_role check constraint already exists. Skipping.';
END $$;

-- Step 4: Ensure unique constraint on (employee_id, shift_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shift_assignments_employee_id_shift_id_key'
      AND conrelid = 'public.shift_assignments'::regclass
  ) THEN
    ALTER TABLE public.shift_assignments
      ADD CONSTRAINT shift_assignments_employee_id_shift_id_key
      UNIQUE (employee_id, shift_id);
    RAISE NOTICE 'Added unique constraint on (employee_id, shift_id)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists. Skipping.';
  END IF;
END $$;

-- Step 5: Create indexes (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_shift_assignments_duty_role ON public.shift_assignments(duty_role);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee_shift ON public.shift_assignments(employee_id, shift_id);

-- Step 6: Enable RLS (idempotent)
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS policies (drop + create for idempotency)
-- NOTE: Uses only 'admin' (not 'super_admin') to match the user_role enum
DROP POLICY IF EXISTS "Admins manage assignments" ON public.shift_assignments;
DROP POLICY IF EXISTS "Employees read own assignments" ON public.shift_assignments;
DROP POLICY IF EXISTS "Employees confirm own assignments" ON public.shift_assignments;

CREATE POLICY "Admins manage assignments" ON public.shift_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Employees read own assignments" ON public.shift_assignments
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Employees confirm own assignments" ON public.shift_assignments
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Done
SELECT 'Migration 006 complete — shift_assignments table verified.' AS status;
