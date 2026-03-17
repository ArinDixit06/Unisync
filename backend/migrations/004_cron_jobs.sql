-- migrations/004_cron_jobs.sql
-- Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-email-bodies',
  '0 2 * * *',
  $$UPDATE emails SET raw_headers = NULL, preview_snippet = LEFT(preview_snippet, 200)
    WHERE body_expires_at < NOW() AND raw_headers IS NOT NULL$$
);

SELECT cron.schedule(
  'unsnooze-emails',
  '* * * * *',
  $$UPDATE emails SET is_snoozed = FALSE, snoozed_until = NULL
    WHERE is_snoozed = TRUE AND snoozed_until <= NOW()$$
);
