-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists content (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  platform    text not null,
  generated_content text not null default '',
  raw_inputs  jsonb not null default '{}',
  metadata    jsonb not null default '{}',
  created_at  timestamptz default now()
);

create index if not exists content_user_email_idx on content(user_email);
create index if not exists content_created_at_idx  on content(created_at desc);
create index if not exists content_platform_idx    on content(platform);

-- Disable Row Level Security (all access is controlled at the application layer)
alter table content disable row level security;
