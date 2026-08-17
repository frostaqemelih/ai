export type FailReason = 'touch' | 'backgrounded' | 'interrupted';

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  goalMs: number;
  durationMs: number;
  completed: boolean;
  failReason?: FailReason;
  /** True for a day rescued via Streak Insurance rather than an actual timed run —
   *  counts toward the streak but is excluded from performance stats. */
  streakSaved?: boolean;
}

export interface AppSettings {
  hasOnboarded: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  lastSelectedGoalMs: number;
  selectedRingColorId: string;
  premiumThemeEnabled: boolean;
  notificationsEnabled: boolean;
  notificationsPermissionAsked: boolean;
}

export interface ActiveSession {
  startedAt: number;
  goalMs: number;
}

export interface DerivedStats {
  totalSessions: number;
  totalFocusMs: number;
  personalBestMs: number;
  averageSessionMs: number;
  currentStreak: number;
  longestStreak: number;
  todayBestMs: number;
  streakDateKeys: Set<string>;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  check: (stats: DerivedStats, sessions: SessionRecord[]) => boolean;
}

export interface AchievementState {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}
