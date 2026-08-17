export function toLocalDateKey(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(a: number, b: number): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b);
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date.getTime());
}

export const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Returns the 7 local date keys for the current week (Monday first), oldest to newest.
export function getCurrentWeekKeys(now: number = Date.now()): string[] {
  const d = new Date(now);
  const jsDay = d.getDay(); // 0 = Sunday
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mondayOffset);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    keys.push(toLocalDateKey(day.getTime()));
  }
  return keys;
}
