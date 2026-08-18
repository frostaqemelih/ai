import type { SessionRecord, SessionSchedule } from '../types';
import { addDaysToKey, getCurrentWeekKeys, toLocalDateKey } from './date';

const MAX_WEEKS_CHECKED = 520; // ~10 years — a hard stop, not an expected case.

// Position of a schedule weekday (1=Sunday..7=Saturday) within a Monday-first
// week array like getCurrentWeekKeys() returns (index 0=Monday..6=Sunday).
function weekdayToMondayFirstIndex(weekday: number): number {
  const jsDay = weekday - 1; // 0=Sunday..6=Saturday
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Counts consecutive, fully-elapsed weeks (most recent first, current
// in-progress week excluded) in which the user completed a real session on
// every one of their scheduled weekdays. Used only by the schedule-adherence
// achievements — never touches streak/session-ending logic.
export function computeScheduleAdherenceWeeks(
  sessions: SessionRecord[],
  schedule: SessionSchedule | null,
  now: number = Date.now()
): number {
  if (!schedule || schedule.weekdays.length === 0) return 0;

  const completedDateKeys = new Set(
    sessions.filter((s) => s.completed && !s.streakSaved).map((s) => toLocalDateKey(s.endedAt))
  );

  const scheduledIndices = schedule.weekdays.map(weekdayToMondayFirstIndex);
  let cursorMonday = addDaysToKey(getCurrentWeekKeys(now)[0], -7);
  let weeks = 0;

  for (let i = 0; i < MAX_WEEKS_CHECKED; i++) {
    const weekKeys: string[] = [];
    for (let d = 0; d < 7; d++) weekKeys.push(addDaysToKey(cursorMonday, d));
    const allPresent = scheduledIndices.every((idx) => completedDateKeys.has(weekKeys[idx]));
    if (!allPresent) break;
    weeks += 1;
    cursorMonday = addDaysToKey(cursorMonday, -7);
  }

  return weeks;
}
