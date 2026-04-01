-- Phase 3 migration
-- Adds: response_deadline + pay_amount to exam_shifts
--       published_by, published_at to exam_shifts
--       broadcast_logs table

-- ── exam_shifts additions
ALTER TABLE exam_shifts
  ADD COLUMN IF NOT EXISTS pay_amount         INTEGER NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS response_deadline  DATE,
  ADD COLUMN IF NOT EXISTS published_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by       UUID REFERENCES users(id);

-- Auto-set response_deadline to 3 days before exam_date if not set
CREATE OR REPLACE FUNCTION set_response_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_deadline IS NULL THEN
    NEW.response_deadline := NEW.exam_date - INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_response_deadline ON exam_shifts;
CREATE TRIGGER trg_set_response_deadline
  BEFORE INSERT OR UPDATE ON exam_shifts
  FOR EACH ROW EXECUTE FUNCTION set_response_deadline();

-- ── employee_shift_assignments: add responded_at
ALTER TABLE employee_shift_assignments
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- ── broadcast_logs table
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  target     TEXT NOT NULL DEFAULT 'approved',
  sent       INTEGER NOT NULL DEFAULT 0,
  failed     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcast_logs"
  ON broadcast_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── employee_profiles: add reviewed columns
ALTER TABLE employee_profiles
  ADD COLUMN IF NOT EXISTS reviewed_by  UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_exam_shifts_status_date
  ON exam_shifts(status, exam_date);

CREATE INDEX IF NOT EXISTS idx_assignments_employee_shift
  ON employee_shift_assignments(employee_id, shift_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_created
  ON broadcast_logs(created_at DESC);
