-- Global social-proof counter — "X hours worldwide today, phone-free".
-- Fully opt-in: a device only ever calls increment_global_stats() if the
-- user turned on Settings > "Contribute to global stats (anonymous)".
-- No device/session identifier is stored here at all, just a running total
-- per calendar day (server UTC date) — there is nothing to link back to
-- any individual run or person.

create table if not exists daily_aggregate_stats (
  day date primary key,
  total_duration_ms bigint not null default 0
);

alter table daily_aggregate_stats enable row level security;

create policy "anyone can read daily aggregate stats" on daily_aggregate_stats
  for select using (true);

-- SECURITY DEFINER so the anon key can add to today's total via a controlled
-- increment (never a raw client-side UPDATE, which would allow overwriting
-- the total or reading/writing other rows).
create or replace function increment_global_stats(duration_ms bigint)
returns bigint
language plpgsql
security definer
as $$
declare
  new_total bigint;
begin
  insert into daily_aggregate_stats (day, total_duration_ms)
  values (current_date, greatest(duration_ms, 0))
  on conflict (day) do update
    set total_duration_ms = daily_aggregate_stats.total_duration_ms + greatest(excluded.total_duration_ms, 0)
  returning total_duration_ms into new_total;
  return new_total;
end;
$$;

grant execute on function increment_global_stats(bigint) to anon;
