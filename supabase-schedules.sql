-- ============================================================
-- Operant AI — Schedules migration
-- Run this in the Supabase SQL editor
-- ============================================================

create table if not exists schedules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  workflow_id   text not null,
  workflow_name text not null,
  blueprint     jsonb not null,
  frequency     text not null check (frequency in ('hourly', 'daily', 'weekly')),
  enabled       boolean not null default true,
  last_run_at   timestamptz,
  next_run_at   timestamptz not null,
  created_at    timestamptz not null default now(),
  run_hour      smallint check (run_hour >= 0 and run_hour <= 23),
  unique (user_id, workflow_id)
);

-- Migration: add run_hour to existing deployments
alter table schedules add column if not exists run_hour smallint check (run_hour >= 0 and run_hour <= 23);

alter table schedules enable row level security;

create policy "Users manage own schedules"
  on schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypasses RLS — used by the cron handler
create policy "Service role manages schedules"
  on schedules for all
  using (auth.role() = 'service_role');
