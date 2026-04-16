-- run_all.sql
-- Run this entire file in Supabase SQL Editor to set up the full schema at once.
-- Order matters — do not rearrange.

-- ── 001: Users ────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  full_name        TEXT NOT NULL DEFAULT '',
  date_of_birth    DATE,
  account_type     TEXT NOT NULL DEFAULT 'primary' CHECK (account_type IN ('primary', 'caregiver')),
  push_token       TEXT,
  language         TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'ar')),
  privacy_mode     BOOLEAN NOT NULL DEFAULT FALSE,
  trial_start_date TIMESTAMPTZ,
  is_subscribed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE INDEX idx_users_email ON public.users(email);

-- ── 002: Medications ──────────────────────────────────────────────────────────
CREATE TABLE public.medications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  cover_name     TEXT,
  dosage         TEXT NOT NULL DEFAULT '',
  frequency      TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','twice-daily','3x-daily','as-needed')),
  reminder_times TEXT[] NOT NULL DEFAULT ARRAY['08:00'],
  color          TEXT NOT NULL DEFAULT '#e3f7f0',
  icon_name      TEXT NOT NULL DEFAULT 'pill',
  icon_category  TEXT NOT NULL DEFAULT 'med' CHECK (icon_category IN ('med','neutral')),
  is_prn         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  supply_count   INTEGER,
  refill_threshold INTEGER DEFAULT 7,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active  ON public.medications(user_id, is_active);

-- ── 003: Dose Logs ────────────────────────────────────────────────────────────
CREATE TABLE public.dose_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_by      UUID REFERENCES public.users(id),
  scheduled_time TEXT,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes          TEXT,
  skipped        BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason    TEXT
);
CREATE INDEX idx_dose_logs_medication_id ON public.dose_logs(medication_id);
CREATE INDEX idx_dose_logs_user_date     ON public.dose_logs(user_id, taken_at);

-- ── 004: Caregiver Relationships ──────────────────────────────────────────────
CREATE TABLE public.caregiver_relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permissions       TEXT[] NOT NULL DEFAULT ARRAY['view','log'],
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','revoked')),
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_user_id, caregiver_user_id)
);
CREATE INDEX idx_caregiver_rel_patient   ON public.caregiver_relationships(patient_user_id);
CREATE INDEX idx_caregiver_rel_caregiver ON public.caregiver_relationships(caregiver_user_id);

-- ── 005: Caregiver Invites ────────────────────────────────────────────────────
CREATE TABLE public.caregiver_invites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  patient_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_email  TEXT NOT NULL,
  caregiver_name   TEXT NOT NULL DEFAULT 'Caregiver',
  permissions      TEXT[] NOT NULL DEFAULT ARRAY['view','log'],
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invites_token   ON public.caregiver_invites(token);
CREATE INDEX idx_invites_patient ON public.caregiver_invites(patient_user_id);
CREATE INDEX idx_invites_email   ON public.caregiver_invites(caregiver_email);

CREATE OR REPLACE FUNCTION public.accept_caregiver_invite(p_token TEXT, p_caregiver_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_invite public.caregiver_invites;
BEGIN
  SELECT * INTO v_invite FROM public.caregiver_invites WHERE token = p_token AND status = 'pending' AND expires_at > NOW() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite'); END IF;
  UPDATE public.caregiver_invites SET status = 'accepted', accepted_at = NOW() WHERE id = v_invite.id;
  INSERT INTO public.caregiver_relationships (patient_user_id, caregiver_user_id, permissions, accepted_at)
  VALUES (v_invite.patient_user_id, p_caregiver_user_id, v_invite.permissions, NOW())
  ON CONFLICT (patient_user_id, caregiver_user_id)
  DO UPDATE SET status = 'active', permissions = EXCLUDED.permissions, accepted_at = NOW();
  RETURN jsonb_build_object('success', true, 'patient_user_id', v_invite.patient_user_id, 'permissions', v_invite.permissions);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 006: Subscriptions ────────────────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','canceled','expired')),
  trial_start_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date   TIMESTAMPTZ,
  amount_cents            INTEGER NOT NULL DEFAULT 499,
  billing_interval        TEXT NOT NULL DEFAULT 'monthly',
  external_subscription_id TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.create_trial_for_new_user()
RETURNS TRIGGER AS $$
BEGIN INSERT INTO public.subscriptions (user_id) VALUES (NEW.id); UPDATE public.users SET trial_start_date = NOW() WHERE id = NEW.id; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_user_created_start_trial AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_trial_for_new_user();

-- ── 007: Row Level Security ───────────────────────────────────────────────────
ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_invites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_caregiver_access(p_patient_user_id UUID, p_permission TEXT DEFAULT 'view')
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.caregiver_relationships cr WHERE cr.caregiver_user_id = auth.uid() AND cr.patient_user_id = p_patient_user_id AND cr.status = 'active' AND p_permission = ANY(cr.permissions));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "users_own"          ON public.users FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "caregiver_see_patient" ON public.users FOR SELECT USING (EXISTS(SELECT 1 FROM public.caregiver_relationships cr WHERE cr.caregiver_user_id = auth.uid() AND cr.patient_user_id = id AND cr.status = 'active'));
CREATE POLICY "meds_own"           ON public.medications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "meds_cg_view"       ON public.medications FOR SELECT USING (public.has_caregiver_access(user_id, 'view'));
CREATE POLICY "meds_cg_edit"       ON public.medications FOR UPDATE USING (public.has_caregiver_access(user_id, 'edit')) WITH CHECK (public.has_caregiver_access(user_id, 'edit'));
CREATE POLICY "logs_own_read"      ON public.dose_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "logs_own_insert"    ON public.dose_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "logs_cg_view"       ON public.dose_logs FOR SELECT USING (public.has_caregiver_access(user_id, 'view'));
CREATE POLICY "logs_cg_insert"     ON public.dose_logs FOR INSERT WITH CHECK (public.has_caregiver_access(user_id, 'log') AND logged_by = auth.uid());
CREATE POLICY "cgrel_patient"      ON public.caregiver_relationships FOR ALL USING (patient_user_id = auth.uid()) WITH CHECK (patient_user_id = auth.uid());
CREATE POLICY "cgrel_caregiver"    ON public.caregiver_relationships FOR SELECT USING (caregiver_user_id = auth.uid());
CREATE POLICY "invites_patient"    ON public.caregiver_invites FOR ALL USING (patient_user_id = auth.uid()) WITH CHECK (patient_user_id = auth.uid());
CREATE POLICY "invites_public"     ON public.caregiver_invites FOR SELECT USING (TRUE);
CREATE POLICY "subs_own"           ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

-- ── 008: Realtime ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.dose_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.caregiver_invites;
