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
  trackingGranted: boolean;
  trackingPermissionAsked: boolean;
  firstDuelBonusClaimed: boolean;
  lastRatingPromptAt: number | null;
  languageCode: 'system' | 'en' | 'tr';
  contributeToGlobalStats: boolean;
  adWatchDate: string | null;
  adWatchCountToday: number;
  /** Milestone days (from STREAK_MILESTONE_DAYS) already rewarded within the
   *  CURRENT unbroken streak — cleared back to [] whenever the streak
   *  resets, so the same milestone can be rewarded again on a future run. */
  streakMilestonesClaimed: number[];
  /** Supabase friend_links.id this device is paired to, once linked (via
   *  createFriendStreak/joinFriendStreak) — null until the user opts in. */
  friendLinkId: string | null;
  /** The share code for MY OWN friend link, kept locally so it can be
   *  re-shown without a round trip — null if this device only ever joined
   *  someone else's link, since joiners never own a code. */
  friendLinkCode: string | null;
  /** Pre-bought Streak Freezes in inventory, capped by streakFreezeCap() —
   *  auto-consumed by completeSession the moment a streak would otherwise
   *  break, before falling back to the reactive ad/coin rescue prompt. */
  streakFreezesOwned: number;
  /** When true (default), SessionScreen keeps the screen awake for the
   *  duration of a run — without this, the OS's own auto-lock (as little as
   *  30s on iOS) would background the app and fail the session even though
   *  the user never touched the phone. When false, Settings must warn the
   *  user that an auto-lock will end their run. */
  keepScreenAwakeEnabled: boolean;
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
