-- ============================================================
-- TRAINEE™ AI Usage Logs — Rate Limiting Table
-- ============================================================
-- Run this migration in your Supabase Dashboard:
--   SQL Editor → New Query → paste → Run
--
-- This table powers per-user rate limiting for all AI features.
-- It is written to exclusively by Edge Functions using the
-- service role key (bypasses RLS) and is never accessible to
-- the frontend client.
-- ============================================================

create table if not exists ai_usage_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null,
  endpoint    text        not null, -- 'matchmaking' | 'copilot'
  created_at  timestamptz not null default now()
);

-- Efficient lookup for rate-limit window queries
create index if not exists idx_ai_usage_user_endpoint_time
  on ai_usage_logs (user_id, endpoint, created_at desc);

-- Row Level Security — deny all direct client access
alter table ai_usage_logs enable row level security;

-- No client-facing policies: Edge Functions use the service role key
-- which bypasses RLS entirely. This table is invisible to the browser.

-- Auto-cleanup: delete records older than 24 hours to keep the table lean.
-- Supabase pg_cron must be enabled for this to work.
-- If pg_cron is not available, the cleanup is harmless to omit.
-- select cron.schedule(
--   'cleanup-ai-usage-logs',
--   '0 */6 * * *',           -- every 6 hours
--   $$delete from ai_usage_logs where created_at < now() - interval '24 hours'$$
-- );
