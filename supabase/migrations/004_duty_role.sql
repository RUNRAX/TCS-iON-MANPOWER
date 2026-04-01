-- Add duty_role to shift_assignments for the booking attendance feature
ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS duty_role TEXT CHECK (duty_role IN ('Invigilation','Biometric','Registration')),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id);

-- Index for faster lookups by shift+date
CREATE INDEX IF NOT EXISTS idx_shift_assignments_duty_role ON public.shift_assignments(duty_role);
