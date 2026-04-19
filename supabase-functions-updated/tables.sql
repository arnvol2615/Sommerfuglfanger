-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username citext unique not null,
  password_hash text not null,
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table users drop constraint if exists users_username_format_check;
alter table users
  add constraint users_username_format_check
  check (username ~ '^[a-zA-Z0-9_.-]{3,32}$');

-- Sessions (raw token, enkel MVP)
create table if not exists sessions (
  token text primary key default encode(gen_random_bytes(32), 'hex'),
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_expires_at on sessions (expires_at);

-- Auth rate limits
create table if not exists auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_rate_limits_lookup
  on auth_rate_limits (action, bucket_key, created_at desc);

-- Catches
create table if not exists catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  species_id text not null,
  rarity text not null,
  vision_score integer not null check (vision_score between 0 and 100),
  points_awarded integer not null check (points_awarded >= 0),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  has_exif boolean,
  device_make text,
  device_model text,
  captured_at timestamptz,
  found_at timestamptz not null default now(),
  counted_in_leaderboard boolean not null default true,
  suspicion_flags jsonb not null default '[]'::jsonb
);

create index if not exists idx_catches_user_found on catches (user_id, found_at desc);
create index if not exists idx_catches_leaderboard on catches (counted_in_leaderboard, found_at desc);
create index if not exists idx_catches_geo on catches (lat, lng);

-- Leaderboard view
create or replace view leaderboard as
select
  u.id as user_id,
  u.username,
  coalesce(sum(c.points_awarded) filter (where c.counted_in_leaderboard), 0) as score,
  count(*) filter (where c.counted_in_leaderboard) as valid_catch_count
from users u
left join catches c on c.user_id = u.id
group by u.id, u.username
order by score desc;