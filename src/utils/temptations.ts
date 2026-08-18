// Non-interactive flavor text shown briefly during a run to create psychological
// pressure (or, for gentler personas, encouragement). These are never real
// buttons — touching the screen anywhere (including on top of this text) ends
// the run via the same handler as everything else. The actual message pool is
// persona+language-specific, read from i18n by the caller (useSessionEvents)
// and passed in here — this file only handles the timing and random pick.

const MIN_GAP_MS = 25_000;
const MAX_GAP_MS = 55_000;
const FIRST_DELAY_MS = 18_000;

export function nextTemptationDelay(): number {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

export function firstTemptationDelay(): number {
  return FIRST_DELAY_MS;
}

export function randomTemptationMessage(pool: string[], exclude?: string): string {
  if (pool.length === 0) return '';
  const filtered = exclude ? pool.filter((m) => m !== exclude) : pool;
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}
