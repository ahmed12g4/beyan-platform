-- Migration: Create rate_limits table for Supabase-backed rate limiting
-- Run this in the Supabase SQL editor (or via CLI)
-- Created: 2026-02-25

-- Create the table
create table if not exists rate_limits (
    key        text primary key,
    count      int not null default 1,
    reset_at   timestamptz not null,
    created_at timestamptz not null default now()
);

-- Enable RLS (table is only accessed via service_role / anon key from server actions)
alter table rate_limits enable row level security;

-- Allow server-side access (service_role bypasses RLS automatically)
-- No public policies needed — this table should NOT be accessible from the browser

-- Auto-cleanup: Remove expired entries daily to keep the table small
-- Option 1: Via pg_cron (if enabled on your Supabase plan):
-- select cron.schedule('cleanup-rate-limits', '0 4 * * *', $$
--     delete from rate_limits where reset_at < now() - interval '1 hour';
-- $$);

-- Option 2: Manual cleanup query (run periodically):
-- delete from rate_limits where reset_at < now() - interval '1 hour';

-- Index for faster cleanup lookups
create index if not exists idx_rate_limits_reset_at on rate_limits (reset_at);

-- Grant anon & authenticated access (needed because server actions use anon key)
grant select, insert, update, delete on rate_limits to anon;
grant select, insert, update, delete on rate_limits to authenticated;

-- RLS Policy: Allow unrestricted access (server-side only — the app never exposes this table to the browser)
create policy "Server-side full access" on rate_limits
    for all
    using (true)
    with check (true);
