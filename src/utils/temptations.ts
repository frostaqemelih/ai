// Non-interactive flavor text shown briefly during a run to create psychological
// pressure. These are never real buttons — touching the screen anywhere (including
// on top of this text) ends the run via the same handler as everything else.
export const TEMPTATION_MESSAGES = [
  "DON'T TOUCH",
  'KEEP GOING',
  'RESIST',
  'CHECK YOUR PHONE',
  'Someone might have messaged you.',
  'Just one tap...',
  "Don't break the streak.",
  'STAY STRONG',
  'ALMOST THERE',
  "DON'T TOUCH\n10 SECONDS",
];

const MIN_GAP_MS = 25_000;
const MAX_GAP_MS = 55_000;
const FIRST_DELAY_MS = 18_000;

export function nextTemptationDelay(): number {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

export function firstTemptationDelay(): number {
  return FIRST_DELAY_MS;
}

export function randomTemptationMessage(exclude?: string): string {
  const pool = exclude
    ? TEMPTATION_MESSAGES.filter((m) => m !== exclude)
    : TEMPTATION_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
