-- ═══════════════════════════════════════════════════════════════
-- TCS ION Manpower Portal — Complete Database Schema
-- Migration: 001_initial_schema.sql
-- Run: supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════
-- ENUMS
-- ═══════════════════════════════

CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE profile_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE shift_status AS ENUM ('draft', 'published', 'completed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('pending', 'confirmed', 'absent', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'cleared', 'failed');
CREATE TYPE notification_type AS ENUM (
  'shift_created', 'shift_confirmed', 'shift_reminder',
  'payment_cleared', 'profile_approved', 'profile_rejected', 'custom'
);
CREATE TYPE id_proof_type AS ENUM ('aadhaar', 'pan', 'voter_id', 'passport');
CREATE TYPE whatsapp_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

-- ═══════════════════════════════
-- TABLE: users (extends auth.users)
-- ═══════════════════════════════

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'employee',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════
-- TABLE: employee_profiles
-- ═══════════════════════════════

CREATE TABLE public.employee_profiles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  alt_phone               TEXT,
  email                   TEXT NOT NULL,
  address_line1           TEXT NOT NULL,
  address_line2           TEXT,
  city                    TEXT NOT NULL,
  state                   TEXT NOT NULL,
  pincode                 TEXT NOT NULL,
  -- Encrypted at application layer (AES-256-GCM), stored as base64 ciphertext
  bank_account_encrypted  TEXT,
  bank_ifsc_encrypted     TEXT,
  bank_name               TEXT,
  id_proof_type           id_proof_type,
  id_proof_url            TEXT,    -- Supabase Storage path (private bucket)
  photo_url               TEXT,    -- Supabase Storage path
  status                  profile_status NOT NULL DEFAULT 'pending',
  rejection_reason        TEXT,
  approved_by             UUID REFERENCES public.users(id),
  approved_at             TIMESTAMPTZ,
  is_deleted              BOOLEAN NOT NULL DEFAULT false,  -- Soft delete
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════
-- TABLE: exam_shifts
-- ═══════════════════════════════

CREATE TABLE public.exam_shifts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  exam_date         DATE NOT NULL,
  shift_number      SMALLINT NOT NULL CHECK (shift_number BETWEEN 1 AND 10),
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  venue             TEXT NOT NULL,
  venue_address     TEXT,
  max_employees     SMALLINT NOT NULL DEFAULT 10 CHECK (max_employees > 0),
  min_employees     SMALLINT NOT NULL DEFAULT 1 CHECK (min_employees > 0),
  status            shift_status NOT NULL DEFAULT 'draft',
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES public.users(id),
  broadcast_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- No duplicate shift numbers on the same date
  UNIQUE (exam_date, shift_number)
);

-- ═══════════════════════════════
-- TABLE: shift_assignments
-- ═══════════════════════════════

CREATE TABLE public.shift_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_id      UUID NOT NULL REFERENCES public.exam_shifts(id) ON DELETE CASCADE,
  status        assignment_status NOT NULL DEFAULT 'pending',
  confirmed_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One assignment per employee per shift
  UNIQUE (employee_id, shift_id)
);

-- ═══════════════════════════════
-- TABLE: payments
-- ═══════════════════════════════

CREATE TABLE public.payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_id         UUID NOT NULL REFERENCES public.exam_shifts(id) ON DELETE CASCADE,
  amount           INTEGER NOT NULL CHECK (amount > 0),  -- stored in paise (÷100 = rupees)
  status           payment_status NOT NULL DEFAULT 'pending',
  reference_number TEXT UNIQUE,
  notes            TEXT,
  cleared_by       UUID REFERENCES public.users(id),     -- admin who cleared it
  cleared_at       TIMESTAMPTZ,
  payslip_url      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One payment record per employee per shift
  UNIQUE (employee_id, shift_id)
);

-- ═══════════════════════════════
-- TABLE: notifications
-- ═══════════════════════════════

CREATE TABLE public.notifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type                 notification_type NOT NULL,
  title                TEXT NOT NULL,
  message              TEXT NOT NULL,
  whatsapp_sent        BOOLEAN NOT NULL DEFAULT false,
  whatsapp_message_id  TEXT,
  whatsapp_status      whatsapp_status,
  email_sent           BOOLEAN NOT NULL DEFAULT false,
  is_read              BOOLEAN NOT NULL DEFAULT false,
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════
-- TABLE: audit_logs
-- ═══════════════════════════════

CREATE TABLE public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  action       TEXT NOT NULL,      -- e.g. 'employee.create', 'shift.broadcast'
  entity_type  TEXT NOT NULL,      -- e.g. 'employee', 'shift', 'payment'
  entity_id    UUID,
  before_value JSONB,
  after_value  JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════
-- INDEXES
-- ═══════════════════════════════

-- Employee queries
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_status ON public.employee_profiles(status);
CREATE INDEX idx_employee_profiles_is_deleted ON public.employee_profiles(is_deleted);

-- Shift queries
CREATE INDEX idx_exam_shifts_exam_date ON public.exam_shifts(exam_date);
CREATE INDEX idx_exam_shifts_status ON public.exam_shifts(status);

-- Assignment queries
CREATE INDEX idx_shift_assignments_employee_id ON public.shift_assignments(employee_id);
CREATE INDEX idx_shift_assignments_shift_id ON public.shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_status ON public.shift_assignments(status);

-- Payment queries
CREATE INDEX idx_payments_employee_id ON public.payments(employee_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Notification queries
CREATE INDEX idx_notifications_employee_id ON public.notifications(employee_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Audit queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ═══════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'employee_profiles', 'exam_shifts',
    'shift_assignments', 'payments'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ═══════════════════════════════
-- AUDIT LOG TRIGGER FUNCTION
-- ═══════════════════════════════

CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action  TEXT;
BEGIN
  -- Get current user from JWT
  v_user_id := auth.uid();
  v_action  := TG_TABLE_NAME || '.' || lower(TG_OP);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, after_value)
    VALUES (v_user_id, v_action, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, before_value, after_value)
    VALUES (v_user_id, v_action, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, before_value)
    VALUES (v_user_id, v_action, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employee_profiles', 'exam_shifts', 'shift_assignments', 'payments'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit
       AFTER INSERT OR UPDATE OR DELETE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.create_audit_log()',
      t, t
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Defense Layer 2 at DB
-- ═══════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_shifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;

-- ── Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── Helper: check if current user is active employee
CREATE OR REPLACE FUNCTION public.is_active_employee()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'employee' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────
-- RLS: users
-- ─────────────────────────────────────
-- Admin: read all
CREATE POLICY "admin_read_all_users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Employee: read own record only
CREATE POLICY "employee_read_own_user" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Admin: update any user
CREATE POLICY "admin_update_users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- System: insert on signup (handled via auth trigger)
CREATE POLICY "system_insert_user" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────
-- RLS: employee_profiles
-- ─────────────────────────────────────

-- Admin: full access to all non-deleted profiles
CREATE POLICY "admin_full_access_profiles" ON public.employee_profiles
  FOR ALL USING (public.is_admin());

-- Employee: read own profile (not soft deleted)
CREATE POLICY "employee_read_own_profile" ON public.employee_profiles
  FOR SELECT USING (user_id = auth.uid() AND is_deleted = false);

-- Employee: insert own profile (only if pending/first time)
CREATE POLICY "employee_insert_own_profile" ON public.employee_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Employee: update own profile (only while pending)
CREATE POLICY "employee_update_pending_profile" ON public.employee_profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    AND status = 'pending'
    AND is_deleted = false
  );

-- ─────────────────────────────────────
-- RLS: exam_shifts
-- ─────────────────────────────────────

-- Admin: full access
CREATE POLICY "admin_full_access_shifts" ON public.exam_shifts
  FOR ALL USING (public.is_admin());

-- Employee: read only published/completed shifts
CREATE POLICY "employee_read_published_shifts" ON public.exam_shifts
  FOR SELECT USING (
    public.is_active_employee()
    AND status IN ('published', 'completed')
  );

-- ─────────────────────────────────────
-- RLS: shift_assignments
-- ─────────────────────────────────────

-- Admin: full access
CREATE POLICY "admin_full_access_assignments" ON public.shift_assignments
  FOR ALL USING (public.is_admin());

-- Employee: read own assignments
CREATE POLICY "employee_read_own_assignments" ON public.shift_assignments
  FOR SELECT USING (employee_id = auth.uid());

-- Employee: insert own assignment (confirm a shift)
CREATE POLICY "employee_confirm_shift" ON public.shift_assignments
  FOR INSERT WITH CHECK (
    employee_id = auth.uid()
    AND public.is_active_employee()
  );

-- Employee: update own assignment (withdraw before completion)
CREATE POLICY "employee_update_own_assignment" ON public.shift_assignments
  FOR UPDATE USING (
    employee_id = auth.uid()
    AND status = 'confirmed'
  );

-- ─────────────────────────────────────
-- RLS: payments
-- ─────────────────────────────────────

-- Admin: full access (insert, update, read all)
CREATE POLICY "admin_full_access_payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- Employee: read own payments only
CREATE POLICY "employee_read_own_payments" ON public.payments
  FOR SELECT USING (employee_id = auth.uid());

-- ─────────────────────────────────────
-- RLS: notifications
-- ─────────────────────────────────────

-- Admin: full access (to create and read all)
CREATE POLICY "admin_full_access_notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- Employee: read own notifications
CREATE POLICY "employee_read_own_notifications" ON public.notifications
  FOR SELECT USING (employee_id = auth.uid());

-- Employee: mark own as read
CREATE POLICY "employee_mark_read_notifications" ON public.notifications
  FOR UPDATE USING (
    employee_id = auth.uid()
    AND is_read = false
  )
  WITH CHECK (is_read = true);

-- ─────────────────────────────────────
-- RLS: audit_logs (admin read-only)
-- ─────────────────────────────────────

CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "system_insert_audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);  -- Inserted by triggers as SECURITY DEFINER

-- ═══════════════════════════════════════════════════
-- FUNCTION: handle new user signup
-- Creates public.users record on auth.users insert
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════
-- REALTIME — enable for live dashboard updates
-- ═══════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- ═══════════════════════════════════════════════════
-- VIEWS (convenience — RLS enforced on base tables)
-- ═══════════════════════════════════════════════════

-- Admin: employee list with status
CREATE OR REPLACE VIEW public.v_employee_list AS
SELECT
  u.id,
  u.email,
  u.phone,
  u.is_active,
  u.last_login_at,
  ep.full_name,
  ep.city,
  ep.state,
  ep.status AS profile_status,
  ep.photo_url,
  ep.created_at AS joined_at
FROM public.users u
LEFT JOIN public.employee_profiles ep ON ep.user_id = u.id
WHERE u.role = 'employee' AND (ep.is_deleted IS NULL OR ep.is_deleted = false);

-- Admin: shift fill rate
CREATE OR REPLACE VIEW public.v_shift_fill_rate AS
SELECT
  s.id,
  s.title,
  s.exam_date,
  s.shift_number,
  s.start_time,
  s.end_time,
  s.venue,
  s.status,
  s.max_employees,
  s.min_employees,
  COUNT(sa.id) FILTER (WHERE sa.status = 'confirmed') AS confirmed_count,
  COUNT(sa.id) FILTER (WHERE sa.status = 'completed') AS completed_count,
  COUNT(sa.id) FILTER (WHERE sa.status = 'absent')    AS absent_count,
  s.broadcast_sent_at
FROM public.exam_shifts s
LEFT JOIN public.shift_assignments sa ON sa.shift_id = s.id
GROUP BY s.id;

-- Employee: my shift history with payment
CREATE OR REPLACE VIEW public.v_my_shift_history AS
SELECT
  sa.id AS assignment_id,
  s.exam_date,
  s.shift_number,
  s.start_time,
  s.end_time,
  s.venue,
  sa.status AS assignment_status,
  p.amount,
  p.status AS payment_status,
  p.cleared_at,
  sa.employee_id
FROM public.shift_assignments sa
JOIN public.exam_shifts s ON s.id = sa.shift_id
LEFT JOIN public.payments p ON p.shift_id = sa.shift_id AND p.employee_id = sa.employee_id;

COMMENT ON TABLE public.users IS 'Core user table extending Supabase auth.users';
COMMENT ON TABLE public.employee_profiles IS 'Employee KYC data — sensitive fields encrypted at app layer';
COMMENT ON TABLE public.exam_shifts IS 'Exam day shift definitions created by admin';
COMMENT ON TABLE public.shift_assignments IS 'Employee shift confirmations';
COMMENT ON TABLE public.payments IS 'Payment records for completed shifts';
COMMENT ON TABLE public.notifications IS 'In-app + WhatsApp notification log';
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail — 2 year retention';
