CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'info',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Employees update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = employee_id);

CREATE INDEX idx_notifications_employee_id
  ON public.notifications(employee_id, created_at DESC);
