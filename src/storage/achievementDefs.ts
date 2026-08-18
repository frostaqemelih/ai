import type { AchievementDef } from '../types';
import { computeScheduleAdherenceWeeks } from '../utils/scheduleAdherence';

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_session',
    title: 'First Session',
    description: 'Complete your first session',
    check: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'five_minutes',
    title: '5 Minutes',
    description: 'Stay away for 5 minutes straight',
    check: (stats) => stats.personalBestMs >= 5 * 60 * 1000,
  },
  {
    id: 'fifteen_minutes',
    title: '15 Minutes',
    description: 'Stay away for 15 minutes straight',
    check: (stats) => stats.personalBestMs >= 15 * 60 * 1000,
  },
  {
    id: 'thirty_minutes',
    title: '30 Minutes',
    description: 'Stay away for 30 minutes straight',
    check: (stats) => stats.personalBestMs >= 30 * 60 * 1000,
  },
  {
    id: 'one_hour',
    title: '1 Hour',
    description: 'Stay away for a full hour',
    check: (stats) => stats.personalBestMs >= 60 * 60 * 1000,
  },
  {
    id: 'seven_day_streak',
    title: '7 Day Streak',
    description: 'Complete a session 7 days in a row',
    check: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'ten_sessions',
    title: '10 Sessions',
    description: 'Complete 10 sessions',
    check: (stats) => stats.totalSessions >= 10,
  },
  {
    id: 'personal_best',
    title: 'Personal Best',
    description: 'Beat your own record',
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
    title: '10 Hours Away',
    description: 'Accumulate 10 hours of total focus time',
    check: (stats) => stats.totalFocusMs >= 10 * 60 * 60 * 1000,
  },
  {
    id: 'total_focus_50h',
    title: '50 Hours Away',
    description: 'Accumulate 50 hours of total focus time',
    check: (stats) => stats.totalFocusMs >= 50 * 60 * 60 * 1000,
  },
  {
    id: 'total_focus_100h',
    title: '100 Hours Away',
    description: 'Accumulate 100 hours of total focus time',
    check: (stats) => stats.totalFocusMs >= 100 * 60 * 60 * 1000,
  },
  {
    id: 'same_goal_10',
    title: 'Creature of Habit',
    description: 'Complete 10 sessions in a row with the same goal',
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
    title: 'No Matter Where',
    description: 'Complete sessions from 3 different timezones',
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
    title: 'Creature of Routine',
    description: 'Hit every scheduled session for 4 straight weeks',
    check: (_stats, sessions, settings) =>
      computeScheduleAdherenceWeeks(sessions, settings?.schedule ?? null) >= 4,
  },
  {
    id: 'schedule_12_weeks',
    title: 'It Stuck',
    description: 'Hit every scheduled session for 12 straight weeks',
    check: (_stats, sessions, settings) =>
      computeScheduleAdherenceWeeks(sessions, settings?.schedule ?? null) >= 12,
  },
];
