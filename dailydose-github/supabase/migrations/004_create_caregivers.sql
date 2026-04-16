-- 004_create_caregivers.sql
-- Relationship between a patient and their approved caregiver

CREATE TABLE public.caregiver_relationships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permissions         TEXT[] NOT NULL DEFAULT ARRAY['view', 'log'],
                      -- possible values: 'view', 'log', 'edit'
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'paused', 'revoked')),
  invited_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_user_id, caregiver_user_id)
);

CREATE INDEX idx_caregiver_rel_patient   ON public.caregiver_relationships(patient_user_id);
CREATE INDEX idx_caregiver_rel_caregiver ON public.caregiver_relationships(caregiver_user_id);

COMMENT ON TABLE public.caregiver_relationships IS
  'Links a caregiver to a patient with specific permissions';
COMMENT ON COLUMN public.caregiver_relationships.permissions IS
  'Array of granted actions: view, log, edit';
