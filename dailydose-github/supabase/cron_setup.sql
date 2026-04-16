-- cron_setup.sql
-- Run this in Supabase SQL Editor to schedule the reminder check every 5 minutes
-- Requires pg_cron extension (enabled by default on Supabase)

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- needed to call edge functions from cron

-- Schedule reminder check every 5 minutes
SELECT cron.schedule(
  'dose-reminder-check',           -- job name
  '*/5 * * * *',                   -- every 5 minutes
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/schedule-reminder-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
    body   := '{}'
  );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'dose-reminder-check';

-- To set the app settings (run once):
-- ALTER DATABASE postgres SET app.supabase_url = 'https://xxxx.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'eyJ...';

-- To disable/remove the cron job:
-- SELECT cron.unschedule('dose-reminder-check');
