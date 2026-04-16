-- 003_create_dose_logs.sql
-- Records every time a dose is taken

CREATE TABLE public.dose_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id   UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_by       UUID REFERENCES public.users(id),  -- NULL = self, UUID = caregiver
  scheduled_time  TEXT,                               -- "08:00" — which reminder slot
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  skipped         BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason     TEXT
);

-- Indexes for fast daily queries
CREATE INDEX idx_dose_logs_medication_id ON public.dose_logs(medication_id);
CREATE INDEX idx_dose_logs_user_date     ON public.dose_logs(user_id, taken_at);
CREATE INDEX idx_dose_logs_taken_at      ON public.dose_logs(taken_at DESC);

-- View: today's dose status per medication
CREATE OR REPLACE VIEW public.todays_doses AS
SELECT
  m.id          AS medication_id,
  m.user_id,
  m.name,
  m.cover_name,
  m.dosage,
  m.frequency,
  m.reminder_times,
  m.color,
  m.icon_name,
  m.is_prn,
  COUNT(dl.id) FILTER (
    WHERE dl.taken_at::date = CURRENT_DATE AND NOT dl.skipped
  )             AS doses_taken_today,
  CASE m.frequency
    WHEN 'daily'       THEN 1
    WHEN 'twice-daily' THEN 2
    WHEN '3x-daily'    THEN 3
    ELSE 0
  END           AS doses_required_today
FROM public.medications m
LEFT JOIN public.dose_logs dl ON dl.medication_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.id;

COMMENT ON TABLE public.dose_logs IS 'Log of every dose taken or skipped';
