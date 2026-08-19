import type { AchievementDef } from '../types';
import { computeScheduleAdherenceWeeks } from '../utils/scheduleAdherence';

// Pure logic only — id + unlock condition. No title/description here: the
// engine never touches text or locale (Faz 13-A removed the
// statsEngine -> i18n import cycle). Display text is resolved in the UI
// layer from `achievementDefs.<id>.title` / `.description` in
// en.json/tr.json, keyed by this same `id`.
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_session',
    check: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'five_minutes',
    check: (stats) => stats.personalBestMs >= 5 * 60 * 1000,
  },
  {
    id: 'fifteen_minutes',
    check: (stats) => stats.personalBestMs >= 15 * 60 * 1000,
  },
  {
    id: 'thirty_minutes',
    check: (stats) => stats.personalBestMs >= 30 * 60 * 1000,
  },
  {
    id: 'one_hour',
    check: (stats) => stats.personalBestMs >= 60 * 60 * 1000,
  },
  {
    id: 'seven_day_streak',
    check: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'ten_sessions',
    check: (stats) => stats.totalSessions >= 10,
  },
  {
    id: 'personal_best',
    check: (_stats, sessions) => {
      let runningBest = 0;
      let improvements = 0;
      const ordered = sessions
        .filter((s) => !s.streakSaved)
        .sort((a, b) => a.endedAt - b.endedAt);
      for (const s of ordered) {
        if (s.durationMs > runningBest) {
          improvements += 1;
          runningBest = s.durationMs;
        }
      }
      return improvements >= 2;
    },
  },
  // Long-game tier (Faz 10-D) — these sit well beyond the first-week goals
  // above and exist to give committed users something to chase months in.
  {
    id: 'total_focus_10h',
    check: (stats) => stats.totalFocusMs >= 10 * 60 * 60 * 1000,
  },
  {
    id: 'total_focus_50h',
    check: (stats) => stats.totalFocusMs >= 50 * 60 * 60 * 1000,
  },
  {
    id: 'total_focus_100h',
    check: (stats) => stats.totalFocusMs >= 100 * 60 * 60 * 1000,
  },
  {
    id: 'same_goal_10',
    check: (_stats, sessions) => {
      const ordered = sessions
        .filter((s) => s.completed && !s.streakSaved)
        .sort((a, b) => b.endedAt - a.endedAt);
      if (ordered.length < 10) return false;
      const goalMs = ordered[0].goalMs;
      return ordered.slice(0, 10).every((s) => s.goalMs === goalMs);
    },
  },
  {
    id: 'cross_timezone',
    check: (_stats, sessions) => {
      const offsets = new Set(
        sessions
          .filter((s) => s.completed && !s.streakSaved && s.tzOffsetMinutes !== undefined)
          .map((s) => s.tzOffsetMinutes)
      );
      return offsets.size >= 3;
    },
  },
  {
    id: 'schedule_4_weeks',
    check: (_stats, sessions, settings) =>
      computeScheduleAdherenceWeeks(sessions, settings?.schedule ?? null) >= 4,
  },
  {
    id: 'schedule_12_weeks',
    check: (_stats, sessions, settings) =>
      computeScheduleAdherenceWeeks(sessions, settings?.schedule ?? null) >= 12,
  },
];
