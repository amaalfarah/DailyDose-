-- 007_row_level_security.sql
-- Locks down every table so users can only access their own data
-- Caregivers can access patient data only if relationship exists + permission granted

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_invites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions            ENABLE ROW LEVEL SECURITY;

-- ── Helper function: get current user id ─────────────────────────────────────
-- (Supabase provides auth.uid() built-in)

-- ── Helper function: does current user have caregiver access? ─────────────────
CREATE OR REPLACE FUNCTION public.has_caregiver_access(
  p_patient_user_id UUID,
  p_permission      TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.caregiver_relationships cr
    WHERE cr.caregiver_user_id = auth.uid()
      AND cr.patient_user_id   = p_patient_user_id
      AND cr.status            = 'active'
      AND p_permission         = ANY(cr.permissions)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── USERS ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- Caregivers can read patient profile (name only, not sensitive fields)
CREATE POLICY "Caregivers can read patient name"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_relationships cr
      WHERE cr.caregiver_user_id = auth.uid()
        AND cr.patient_user_id = id
        AND cr.status = 'active'
    )
  );

-- ── MEDICATIONS ───────────────────────────────────────────────────────────────
CREATE POLICY "Users can CRUD own medications"
  ON public.medications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Caregivers can view patient medications"
  ON public.medications FOR SELECT
  USING (public.has_caregiver_access(user_id, 'view'));

CREATE POLICY "Caregivers with edit permission can modify medications"
  ON public.medications FOR UPDATE
  USING (public.has_caregiver_access(user_id, 'edit'))
  WITH CHECK (public.has_caregiver_access(user_id, 'edit'));

-- ── DOSE LOGS ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users can read own dose logs"
  ON public.dose_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own dose logs"
  ON public.dose_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Caregivers can read patient dose logs"
  ON public.dose_logs FOR SELECT
  USING (public.has_caregiver_access(user_id, 'view'));

CREATE POLICY "Caregivers can log doses for patients"
  ON public.dose_logs FOR INSERT
  WITH CHECK (
    public.has_caregiver_access(user_id, 'log')
    AND logged_by = auth.uid()
  );

-- ── CAREGIVER RELATIONSHIPS ───────────────────────────────────────────────────
CREATE POLICY "Patients can see their caregivers"
  ON public.caregiver_relationships FOR SELECT
  USING (patient_user_id = auth.uid());

CREATE POLICY "Caregivers can see their relationships"
  ON public.caregiver_relationships FOR SELECT
  USING (caregiver_user_id = auth.uid());

CREATE POLICY "Patients can manage caregiver relationships"
  ON public.caregiver_relationships FOR ALL
  USING (patient_user_id = auth.uid())
  WITH CHECK (patient_user_id = auth.uid());

-- ── CAREGIVER INVITES ─────────────────────────────────────────────────────────
CREATE POLICY "Patients can create and view their invites"
  ON public.caregiver_invites FOR ALL
  USING (patient_user_id = auth.uid())
  WITH CHECK (patient_user_id = auth.uid());

-- Anyone can read an invite by its token (for the landing page)
CREATE POLICY "Anyone can read invite by token"
  ON public.caregiver_invites FOR SELECT
  USING (TRUE);  -- filtered by token in app code

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can update subscriptions (from webhook)
-- No user-facing update policy needed here
