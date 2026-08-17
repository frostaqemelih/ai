import type { AchievementState, DerivedStats, SessionRecord } from '../types';
import { addDaysToKey, getCurrentWeekKeys, toLocalDateKey } from '../utils/date';
import { ACHIEVEMENT_DEFS } from './achievementDefs';

export interface WeeklyTotal {
  key: string;
  totalMs: number;
}

export function getWeeklyTotals(sessions: SessionRecord[], now: number = Date.now()): WeeklyTotal[] {
  const weekKeys = getCurrentWeekKeys(now);
  const totals = new Map<string, number>(weekKeys.map((k) => [k, 0]));
  for (const s of sessions) {
    const key = toLocalDateKey(s.endedAt);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + s.durationMs);
    }
  }
  return weekKeys.map((key) => ({ key, totalMs: totals.get(key) ?? 0 }));
}

export function deriveStats(sessions: SessionRecord[], now: number = Date.now()): DerivedStats {
  // Every real attempt counts toward time-survived stats, whether the goal was hit
  // or not — only the streak cares about a completed goal. Streak-saved days (via
  // Streak Insurance) are excluded from performance stats entirely.
  const realSessions = sessions.filter((s) => !s.streakSaved);

  const totalSessions = realSessions.length;
  const totalFocusMs = realSessions.reduce((sum, s) => sum + s.durationMs, 0);
  const personalBestMs = realSessions.reduce((max, s) => Math.max(max, s.durationMs), 0);
  const averageSessionMs = realSessions.length > 0 ? totalFocusMs / realSessions.length : 0;

  const todayKey = toLocalDateKey(now);
  const todayBestMs = realSessions
    .filter((s) => toLocalDateKey(s.endedAt) === todayKey)
    .reduce((max, s) => Math.max(max, s.durationMs), 0);

  const streakDateKeys = new Set<string>(
    sessions.filter((s) => s.completed).map((s) => toLocalDateKey(s.endedAt))
  );

  const { currentStreak, longestStreak } = computeStreaks(streakDateKeys, now);

  return {
    totalSessions,
    totalFocusMs,
    personalBestMs,
    averageSessionMs,
    currentStreak,
    longestStreak,
    todayBestMs,
    streakDateKeys,
  };
}

function computeStreaks(
  dateKeys: Set<string>,
  now: number
): { currentStreak: number; longestStreak: number } {
  if (dateKeys.size === 0) return { currentStreak: 0, longestStreak: 0 };

  // Longest streak: walk every date that starts a run (previous day not in set).
  let longestStreak = 0;
  for (const key of dateKeys) {
    const prevKey = addDaysToKey(key, -1);
    if (dateKeys.has(prevKey)) continue;
    let runLength = 1;
    let cursor = key;
    while (dateKeys.has(addDaysToKey(cursor, 1))) {
      cursor = addDaysToKey(cursor, 1);
      runLength += 1;
    }
    longestStreak = Math.max(longestStreak, runLength);
  }

  // Current streak: consecutive days ending today or yesterday (today's session may not exist yet).
  const todayKey = toLocalDateKey(now);
  let anchor: string | null = null;
  if (dateKeys.has(todayKey)) {
    anchor = todayKey;
  } else {
    const yesterdayKey = addDaysToKey(todayKey, -1);
    if (dateKeys.has(yesterdayKey)) anchor = yesterdayKey;
  }

  let currentStreak = 0;
  if (anchor) {
    currentStreak = 1;
    let cursor = anchor;
    while (dateKeys.has(addDaysToKey(cursor, -1))) {
      cursor = addDaysToKey(cursor, -1);
      currentStreak += 1;
    }
  }

  return { currentStreak, longestStreak };
}

export function deriveAchievements(
  stats: DerivedStats,
  sessions: SessionRecord[],
  unlockTimestamps: Record<string, number>
): AchievementState[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const unlocked = def.check(stats, sessions);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      unlocked,
      unlockedAt: unlocked ? unlockTimestamps[def.id] : undefined,
    };
  });
}

// Returns achievement ids that just became unlocked (not already recorded), for celebratory UI.
export function findNewlyUnlocked(
  achievements: AchievementState[],
  unlockTimestamps: Record<string, number>
): string[] {
  return achievements
    .filter((a) => a.unlocked && unlockTimestamps[a.id] === undefined)
    .map((a) => a.id);
}
