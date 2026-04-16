-- 002_create_medications.sql

CREATE TABLE public.medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  cover_name      TEXT,                        -- privacy alias shown in notifications
  dosage          TEXT NOT NULL DEFAULT '',
  frequency       TEXT NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily','twice-daily','3x-daily','as-needed')),
  reminder_times  TEXT[] NOT NULL DEFAULT ARRAY['08:00'],  -- e.g. ["08:00","20:00"]
  color           TEXT NOT NULL DEFAULT '#e3f7f0',
  icon_name       TEXT NOT NULL DEFAULT 'pill',
  icon_category   TEXT NOT NULL DEFAULT 'med'
                  CHECK (icon_category IN ('med', 'neutral')),
  is_prn          BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  supply_count    INTEGER,                     -- number of pills remaining
  refill_threshold INTEGER DEFAULT 7,         -- alert when supply <= this
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active  ON public.medications(user_id, is_active);

COMMENT ON TABLE public.medications IS 'Medications belonging to a user';
COMMENT ON COLUMN public.medications.cover_name IS 'Privacy nickname shown in notifications instead of real name';
COMMENT ON COLUMN public.medications.reminder_times IS 'Array of HH:MM strings for scheduled reminders';
