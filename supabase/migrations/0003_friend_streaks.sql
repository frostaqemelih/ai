-- Friend Streak schema — a persistent "both of us did a session today"
-- streak, separate from the one-off Friend Duel schema (0001_duels.sql)
-- though it shares the same identity model: no accounts, each device is
-- just the random UUID from duelService.getOrCreateDuelDeviceId().
--
-- Design notes:
--   * A friend_links row is created once (via a share code) and persists
--     indefinitely — unlike a duel, which is a single race.
--   * friend_checkins records one row per device per day a session was
--     completed. The streak length is computed client-side
--     (friendStreakService.fetchFriendStreakStatus) by finding consecutive
--     days where BOTH device_a and device_b have a checkin row.
--   * RLS is intentionally permissive, matching 0001_duels.sql's rationale:
--     there is no auth, so this is acceptable for a low-stakes, opt-in
--     social feature and must not be reused for anything sensitive.

create table if not exists friend_links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  device_a text not null,
  device_b text,
  created_at timestamptz not null default now()
);

create table if not exists friend_checkins (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references friend_links(id) on delete cascade,
  device_id text not null,
  day date not null default current_date,
  unique (link_id, device_id, day)
);

alter table friend_links enable row level security;
alter table friend_checkins enable row level security;

create policy "anyone can read friend links" on friend_links for select using (true);
create policy "anyone can create a friend link" on friend_links for insert with check (true);
-- Only allows claiming the still-open second slot — a device can never
-- overwrite an already-claimed device_b (see friendStreakService.joinFriendStreak).
create policy "a device can claim the open second slot" on friend_links
  for update using (device_b is null) with check (true);

create policy "anyone can read friend checkins" on friend_checkins for select using (true);
create policy "anyone can record a friend checkin" on friend_checkins for insert with check (true);
