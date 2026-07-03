-- Run this in your Supabase SQL editor to enable activity logging
-- Dashboard: https://app.supabase.com → your project → SQL Editor

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  action text not null,
  content_id uuid,
  details jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists activity_log_user_email_idx
  on activity_log (user_email, created_at desc);
