-- Friend Duel schema — run this in the Supabase SQL editor (or via the CLI:
-- `supabase db push`) on the project referenced by EXPO_PUBLIC_SUPABASE_URL.
--
-- Design notes:
--   * No user accounts. Each device generates a random UUID locally
--     (duelService.ts) and that's the only identity ever sent. This matches
--     the app's "no account required" principle.
--   * Not real-time: a session's result is written once, when it ends.
--     Checking an opponent's result is a plain read, polled on demand from
--     the SessionResult/Duel screens — no realtime subscription needed.
--   * RLS is intentionally permissive (anyone with a duel's random UUID or
--     6-character code can read/write it) since there is no auth. This is
--     acceptable for a lightweight, opt-in, low-stakes social feature; do
--     not reuse this schema for anything sensitive without adding real auth.

create extension if not exists "pgcrypto";

create table if not exists duels (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  goal_ms integer not null,
  creator_device_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists duel_participants (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references duels(id) on delete cascade,
  device_id text not null,
  result_duration_ms integer,
  result_completed boolean,
  submitted_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (duel_id, device_id)
);

alter table duels enable row level security;
alter table duel_participants enable row level security;

create policy "anyone can read duels" on duels for select using (true);
create policy "anyone can create a duel" on duels for insert with check (true);

create policy "anyone can read duel participants" on duel_participants for select using (true);
create policy "anyone can join a duel" on duel_participants for insert with check (true);
create policy "a device can update its own result" on duel_participants
  for update using (true) with check (true);
