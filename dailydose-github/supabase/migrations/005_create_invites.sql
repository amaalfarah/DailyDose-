-- 005_create_invites.sql
-- Pending caregiver invite tokens (before the caregiver creates their account)

CREATE TABLE public.caregiver_invites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token             TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  patient_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_email   TEXT NOT NULL,
  caregiver_name    TEXT NOT NULL DEFAULT 'Caregiver',
  permissions       TEXT[] NOT NULL DEFAULT ARRAY['view', 'log'],
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_token          ON public.caregiver_invites(token);
CREATE INDEX idx_invites_patient        ON public.caregiver_invites(patient_user_id);
CREATE INDEX idx_invites_email          ON public.caregiver_invites(caregiver_email);

-- Function to accept an invite: creates the caregiver_relationship
CREATE OR REPLACE FUNCTION public.accept_caregiver_invite(
  p_token TEXT,
  p_caregiver_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invite public.caregiver_invites;
BEGIN
  -- Fetch and lock the invite
  SELECT * INTO v_invite
  FROM public.caregiver_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Mark invite as accepted
  UPDATE public.caregiver_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invite.id;

  -- Create the caregiver relationship
  INSERT INTO public.caregiver_relationships
    (patient_user_id, caregiver_user_id, permissions, accepted_at)
  VALUES
    (v_invite.patient_user_id, p_caregiver_user_id, v_invite.permissions, NOW())
  ON CONFLICT (patient_user_id, caregiver_user_id)
  DO UPDATE SET status = 'active', permissions = EXCLUDED.permissions, accepted_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'patient_user_id', v_invite.patient_user_id,
    'permissions', v_invite.permissions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.caregiver_invites IS 'One-time invite tokens sent to caregivers via email';
