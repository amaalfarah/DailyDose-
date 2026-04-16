-- 008_realtime.sql
-- Enable Supabase Realtime on tables caregivers need to watch

-- Enable realtime for dose_logs (caregiver sees live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dose_logs;

-- Enable realtime for medications (caregiver sees schedule changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;

-- Enable realtime for caregiver_invites (patient sees when invite is accepted)
ALTER PUBLICATION supabase_realtime ADD TABLE public.caregiver_invites;
