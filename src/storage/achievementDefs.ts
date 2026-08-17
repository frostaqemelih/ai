import type { AchievementDef } from '../types';

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
];
