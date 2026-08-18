import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AchievementState,
  AppSettings,
  DerivedStats,
  FailReason,
  SessionRecord,
} from '../types';
import {
  appendSession,
  clearActiveSession,
  loadAchievementUnlocks,
  loadActiveSession,
  loadCoins,
  loadSessions,
  loadSettings,
  loadUnlockedCosmetics,
  loadUnlockedPersonas,
  resetAllData,
  saveAchievementUnlocks,
  saveCoins,
  saveSettings,
  saveUnlockedCosmetics,
  saveUnlockedPersonas,
  setActiveSession,
} from '../storage/storage';
import { DEFAULT_PERSONA_ID, getPersona, type PersonaId } from '../personas';
import { deriveAchievements, deriveStats, findNewlyUnlocked } from '../storage/statsEngine';
import { DEFAULT_SETTINGS } from '../storage/storage';
import {
  baseCoinsForSession,
  checkStreakMilestone,
  DEFAULT_RING_COLOR_ID,
  DUEL_REFERRAL_BONUS_COINS,
  STREAK_FREEZE_COST,
  streakFreezeCap,
} from '../utils/economy';
import type { CustomerInfo, CustomerInfoUpdateListener } from 'react-native-purchases';
import {
  addCustomerInfoListener,
  configurePurchases,
  getCustomerInfoSafe,
  isEntitled,
  PREMIUM_ENTITLEMENT_ID,
  removeCustomerInfoListener,
} from '../services/purchasesService';
import {
  cancelAllReminders,
  requestNotificationPermission,
  scheduleFriendStreakReminder,
  scheduleInactivityReminder,
  scheduleStreakReminder,
  scheduleTrialEndingReminder,
} from '../services/notificationsService';
import { toLocalDateKey } from '../utils/date';
import { track } from '../services/analyticsService';
import { requestTrackingPermission } from '../services/trackingService';
import { requestAppReview, shouldPromptForRating } from '../services/ratingService';
import { contributeToGlobalStats } from '../services/globalStatsService';
import {
  createFriendStreak as createFriendStreakRequest,
  fetchFriendStreakStatus,
  joinFriendStreak as joinFriendStreakRequest,
  recordCheckin,
} from '../services/friendStreakService';
import { reportError } from '../services/crashService';
import { setNonPersonalizedAdsOnly } from '../services/adsService';

interface CompleteSessionInput {
  startedAt: number;
  goalMs: number;
  completed: boolean;
  failReason?: FailReason;
}

interface CompleteSessionResult {
  record: SessionRecord;
  isNewRecord: boolean;
  newlyUnlocked: AchievementState[];
  coinsEarned: number;
  streakBroken: boolean;
  streakMilestone: { day: number; coins: number } | null;
  streakAutoFrozen: boolean;
}

interface AppDataContextValue {
  loading: boolean;
  settings: AppSettings;
  sessions: SessionRecord[];
  stats: DerivedStats;
  achievements: AchievementState[];
  coins: number;
  unlockedCosmetics: string[];
  unlockedPersonas: string[];
  isPremium: boolean;
  refreshPremiumStatus: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  beginActiveSession: (goalMs: number) => Promise<number>;
  completeSession: (input: CompleteSessionInput) => Promise<CompleteSessionResult>;
  earnCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  saveStreakWithInsurance: () => Promise<void>;
  saveStreakWithCoins: () => Promise<boolean>;
  buyStreakFreeze: () => Promise<boolean>;
  unlockCosmetic: (id: string, cost: number) => Promise<boolean>;
  requestNotificationsPermission: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  requestTracking: () => Promise<boolean>;
  recordAdWatched: () => Promise<number>;
  claimFirstDuelBonus: () => Promise<boolean>;
  maybeRequestRating: () => Promise<void>;
  createFriendStreak: () => Promise<string | null>;
  joinFriendStreak: (code: string) => Promise<boolean>;
  selectPersona: (id: PersonaId, source: 'onboarding' | 'settings') => Promise<void>;
  unlockPersonaWithCoins: (id: PersonaId) => Promise<boolean>;
  resetProgress: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [coins, setCoins] = useState(0);
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>([]);
  const [unlockedPersonas, setUnlockedPersonas] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const unlockTimestampsRef = useRef<Record<string, number>>({});
  // Guards buyStreakFreeze against a double-fire (e.g. a fast double-tap)
  // landing two calls before React re-renders with the disabled button —
  // state alone can't catch that since both calls read it before either
  // update commits, so this needs a synchronous ref instead.
  const buyingFreezeRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [
        loadedSettings,
        loadedSessions,
        loadedUnlocks,
        leftoverActive,
        loadedCoins,
        loadedCosmetics,
        loadedPersonas,
      ] = await Promise.all([
        loadSettings(),
        loadSessions(),
        loadAchievementUnlocks(),
        loadActiveSession(),
        loadCoins(),
        loadUnlockedCosmetics(),
        loadUnlockedPersonas(),
      ]);

      unlockTimestampsRef.current = loadedUnlocks;
      let effectiveSessions = loadedSessions;

      // A leftover "active session" marker means the app was killed, crashed, or the
      // device restarted mid-session — the run never got a chance to end cleanly.
      if (leftoverActive) {
        const now = Date.now();
        const interrupted: SessionRecord = {
          id: makeId(),
          startedAt: leftoverActive.startedAt,
          endedAt: now,
          goalMs: leftoverActive.goalMs,
          durationMs: Math.max(0, Math.min(now - leftoverActive.startedAt, leftoverActive.goalMs)),
          completed: false,
          failReason: 'interrupted',
        };
        effectiveSessions = await appendSession(loadedSessions, interrupted);
        await clearActiveSession();
      }

      setSettings(loadedSettings);
      setSessions(effectiveSessions);
      setCoins(loadedCoins);
      setUnlockedCosmetics(loadedCosmetics);
      setUnlockedPersonas(loadedPersonas);
      setLoading(false);

      if (loadedSettings.notificationsEnabled) {
        const bootStats = deriveStats(effectiveSessions);
        await rescheduleReminders(effectiveSessions, bootStats);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reschedules both local reminders from current data. Local notifications can't
  // be recomputed in the background, so this fires at boot and after every
  // completed session — the best approximation available without a background task.
  const rescheduleReminders = useCallback(
    async (currentSessions: SessionRecord[], currentStats: DerivedStats) => {
      const todayKey = toLocalDateKey(Date.now());
      const streakActiveToday = currentStats.streakDateKeys.has(todayKey);
      await scheduleStreakReminder(currentStats.currentStreak > 0 && !streakActiveToday);

      const lastActivityAt = currentSessions.reduce<number | null>(
        (max, s) => (max === null || s.endedAt > max ? s.endedAt : max),
        null
      );
      await scheduleInactivityReminder(lastActivityAt);
    },
    []
  );

  // Keeps the trial-ending local reminder in sync with whatever RevenueCat
  // currently reports — scheduled while an entitlement is genuinely mid-trial,
  // cancelled the instant it isn't (converted to paid, cancelled, expired).
  const syncTrialReminder = useCallback((info: CustomerInfo | null) => {
    const entitlement = info?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
    const inTrial = entitlement?.periodType === 'TRIAL';
    scheduleTrialEndingReminder(inTrial ? entitlement!.expirationDateMillis : null).catch((err) =>
      reportError(err)
    );
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    const info = await getCustomerInfoSafe();
    setIsPremium(isEntitled(info));
    syncTrialReminder(info);
  }, [syncTrialReminder]);

  useEffect(() => {
    let listener: CustomerInfoUpdateListener | null = null;
    (async () => {
      await configurePurchases();
      await refreshPremiumStatus();
      listener = (info: CustomerInfo) => {
        setIsPremium(isEntitled(info));
        syncTrialReminder(info);
      };
      addCustomerInfoListener(listener);
    })();
    return () => {
      if (listener) removeCustomerInfoListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Defaults to non-personalized (adsService starts with this true) until
  // the user explicitly grants ATT — this keeps every ad request compliant
  // with Apple's tracking rules for the entire gap before that decision.
  useEffect(() => {
    setNonPersonalizedAdsOnly(!settings.trackingGranted);
  }, [settings.trackingGranted]);

  const stats = useMemo(() => deriveStats(sessions), [sessions]);
  const achievements = useMemo(
    () => deriveAchievements(stats, sessions, unlockTimestampsRef.current),
    [stats, sessions]
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const beginActiveSession = useCallback(async (goalMs: number) => {
    const startedAt = Date.now();
    await setActiveSession({ startedAt, goalMs });
    track('session_started', { goalMs });
    return startedAt;
  }, []);

  const earnCoins = useCallback(async (amount: number) => {
    if (amount <= 0) return;
    setCoins((prev) => {
      const next = prev + amount;
      saveCoins(next);
      return next;
    });
  }, []);

  const spendCoins = useCallback(async (amount: number): Promise<boolean> => {
    if (amount <= 0) return true;
    let success = false;
    setCoins((prev) => {
      if (prev < amount) {
        success = false;
        return prev;
      }
      success = true;
      const next = prev - amount;
      saveCoins(next);
      return next;
    });
    return success;
  }, []);

  const unlockCosmetic = useCallback(
    async (id: string, cost: number): Promise<boolean> => {
      if (unlockedCosmetics.includes(id)) return true;
      const success = await spendCoins(cost);
      if (!success) return false;
      const next = [...unlockedCosmetics, id];
      setUnlockedCosmetics(next);
      await saveUnlockedCosmetics(next);
      return true;
    },
    [unlockedCosmetics, spendCoins]
  );

  // Coin-unlock only — a premium persona never gets added to this list, its
  // availability is checked live against `isPremium` (isPersonaUnlocked)
  // instead, matching the existing gold-cosmetic pattern (premiumOnly ring
  // colors also aren't tracked in unlockedCosmetics).
  const unlockPersonaWithCoins = useCallback(
    async (id: PersonaId): Promise<boolean> => {
      if (unlockedPersonas.includes(id)) return true;
      const persona = getPersona(id);
      if (persona.unlock.type !== 'coins') return false;
      const success = await spendCoins(persona.unlock.cost);
      if (!success) return false;
      const next = [...unlockedPersonas, id];
      setUnlockedPersonas(next);
      await saveUnlockedPersonas(next);
      return true;
    },
    [unlockedPersonas, spendCoins]
  );

  const selectPersona = useCallback(
    async (id: PersonaId, source: 'onboarding' | 'settings'): Promise<void> => {
      await updateSettings({ personaId: id });
      track(source === 'onboarding' ? 'persona_selected' : 'persona_changed', { personaId: id });
    },
    [updateSettings]
  );

  const completeSession = useCallback(
    async ({
      startedAt,
      goalMs,
      completed,
      failReason,
    }: CompleteSessionInput): Promise<CompleteSessionResult> => {
      const endedAt = Date.now();
      const durationMs = completed ? goalMs : Math.max(0, endedAt - startedAt);
      const record: SessionRecord = {
        id: makeId(),
        startedAt,
        endedAt,
        goalMs,
        durationMs,
        completed,
        failReason: completed ? undefined : failReason,
      };

      const previousBest = stats.personalBestMs;
      const previousStreak = stats.currentStreak;
      await clearActiveSession();
      let nextSessions = await appendSession(sessions, record);
      let nextStats = deriveStats(nextSessions);

      let streakBroken = !completed && previousStreak > 0 && nextStats.currentStreak < previousStreak;
      let streakAutoFrozen = false;

      if (streakBroken && settings.streakFreezesOwned > 0) {
        // A pre-bought Streak Freeze absorbs the break automatically — same
        // mechanism as the reactive ad/coin save (a zero-duration
        // streakSaved record), just spent from inventory instead of prompted.
        const freezeRecord: SessionRecord = {
          id: makeId(),
          startedAt: endedAt,
          endedAt,
          goalMs: 0,
          durationMs: 0,
          completed: true,
          streakSaved: true,
        };
        nextSessions = await appendSession(nextSessions, freezeRecord);
        nextStats = deriveStats(nextSessions);
        streakBroken = false;
        streakAutoFrozen = true;
        await updateSettings({ streakFreezesOwned: settings.streakFreezesOwned - 1 });
        track('streak_freeze_auto_used', { remaining: settings.streakFreezesOwned - 1 });
      }

      setSessions(nextSessions);

      const nextAchievements = deriveAchievements(
        nextStats,
        nextSessions,
        unlockTimestampsRef.current
      );
      const newlyUnlockedIds = findNewlyUnlocked(nextAchievements, unlockTimestampsRef.current);

      if (newlyUnlockedIds.length > 0) {
        const stamp = Date.now();
        const nextUnlocks = { ...unlockTimestampsRef.current };
        for (const id of newlyUnlockedIds) {
          nextUnlocks[id] = stamp;
        }
        unlockTimestampsRef.current = nextUnlocks;
        await saveAchievementUnlocks(nextUnlocks);
        for (const id of newlyUnlockedIds) {
          track('achievement_unlocked', { id });
        }
      }

      const newlyUnlocked = nextAchievements.filter((a) => newlyUnlockedIds.includes(a.id));

      const coinsEarned = baseCoinsForSession(record.durationMs, record.completed);
      if (coinsEarned > 0) {
        await earnCoins(coinsEarned);
      }

      let streakMilestone: { day: number; coins: number } | null = null;
      if (completed || streakAutoFrozen) {
        const { claimed, milestone } = checkStreakMilestone(
          previousStreak,
          nextStats.currentStreak,
          settings.streakMilestonesClaimed
        );
        if (milestone) {
          streakMilestone = milestone;
          await earnCoins(milestone.coins);
          await updateSettings({ streakMilestonesClaimed: claimed });
          track('streak_milestone_reached', { day: milestone.day, coins: milestone.coins });
        }
      } else if (nextStats.currentStreak < previousStreak || nextStats.currentStreak === 0) {
        // Streak broke without a milestone crossing — still clear the claim
        // list so a future streak can earn the same milestones again.
        if (settings.streakMilestonesClaimed.length > 0) {
          await updateSettings({ streakMilestonesClaimed: [] });
        }
      }

      if (completed) {
        track('session_completed', { durationMs: record.durationMs, goalMs: record.goalMs });
        if (settings.contributeToGlobalStats) {
          contributeToGlobalStats(record.durationMs).catch((err) => reportError(err));
        }
        if (settings.friendLinkId) {
          const linkId = settings.friendLinkId;
          // Best-effort, same as the global-stats contribution above — a
          // failed sync never blocks the session result from showing, and
          // the reminder is re-scheduled from freshly fetched status so a
          // dropped write here just means a slightly stale reminder.
          recordCheckin(linkId)
            .then(() => fetchFriendStreakStatus(linkId))
            .then((status) => {
              if (status) {
                scheduleFriendStreakReminder(status.currentStreak > 0 && !status.checkedInToday);
              }
            })
            .catch((err) => reportError(err));
        }
      } else {
        track('session_failed', {
          durationMs: record.durationMs,
          goalMs: record.goalMs,
          failReason: record.failReason,
        });
      }

      if (settings.notificationsEnabled) {
        await rescheduleReminders(nextSessions, nextStats);
      }

      return {
        record,
        isNewRecord: record.durationMs > previousBest,
        newlyUnlocked,
        coinsEarned,
        streakBroken,
        streakMilestone,
        streakAutoFrozen,
      };
    },
    [
      sessions,
      stats.personalBestMs,
      stats.currentStreak,
      earnCoins,
      settings.notificationsEnabled,
      settings.contributeToGlobalStats,
      settings.friendLinkId,
      settings.streakMilestonesClaimed,
      settings.streakFreezesOwned,
      updateSettings,
      rescheduleReminders,
    ]
  );

  const grantStreakSave = useCallback(async () => {
    const now = Date.now();
    const record: SessionRecord = {
      id: makeId(),
      startedAt: now,
      endedAt: now,
      goalMs: 0,
      durationMs: 0,
      completed: true,
      streakSaved: true,
    };
    const previousStreak = stats.currentStreak;
    const nextSessions = await appendSession(sessions, record);
    setSessions(nextSessions);

    // A saved streak can itself cross a milestone day (e.g. insurance
    // carries a 6-day streak to 7) — same reward path as a real session.
    const nextStreak = deriveStats(nextSessions).currentStreak;
    const { claimed, milestone } = checkStreakMilestone(
      previousStreak,
      nextStreak,
      settings.streakMilestonesClaimed
    );
    if (milestone) {
      await earnCoins(milestone.coins);
      await updateSettings({ streakMilestonesClaimed: claimed });
      track('streak_milestone_reached', { day: milestone.day, coins: milestone.coins });
    }
  }, [sessions, stats.currentStreak, settings.streakMilestonesClaimed, earnCoins, updateSettings]);

  const saveStreakWithInsurance = useCallback(async () => {
    await grantStreakSave();
  }, [grantStreakSave]);

  const saveStreakWithCoins = useCallback(async (): Promise<boolean> => {
    const success = await spendCoins(STREAK_FREEZE_COST);
    if (!success) return false;
    await grantStreakSave();
    return true;
  }, [spendCoins, grantStreakSave]);

  // Pre-buys one Streak Freeze into inventory, capped by streakFreezeCap —
  // completeSession auto-consumes these before ever falling back to the
  // reactive ad/coin prompt.
  const buyStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (buyingFreezeRef.current) return false;
    if (settings.streakFreezesOwned >= streakFreezeCap(isPremium)) return false;
    buyingFreezeRef.current = true;
    try {
      const success = await spendCoins(STREAK_FREEZE_COST);
      if (!success) return false;
      await updateSettings({ streakFreezesOwned: settings.streakFreezesOwned + 1 });
      return true;
    } finally {
      buyingFreezeRef.current = false;
    }
  }, [settings.streakFreezesOwned, isPremium, spendCoins, updateSettings]);

  const requestNotificationsPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    await updateSettings({ notificationsPermissionAsked: true, notificationsEnabled: granted });
    if (granted) {
      await rescheduleReminders(sessions, stats);
    }
    return granted;
  }, [updateSettings, rescheduleReminders, sessions, stats]);

  const requestTracking = useCallback(async (): Promise<boolean> => {
    const granted = await requestTrackingPermission();
    await updateSettings({ trackingPermissionAsked: true, trackingGranted: granted });
    return granted;
  }, [updateSettings]);

  // Tracks how many rewarded ads the user has watched today, so the UI can
  // offer a "tired of ads? go Premium" nudge after a few — never a block.
  const recordAdWatched = useCallback(async (): Promise<number> => {
    const todayKey = toLocalDateKey(Date.now());
    const nextCount = settings.adWatchDate === todayKey ? settings.adWatchCountToday + 1 : 1;
    await updateSettings({ adWatchDate: todayKey, adWatchCountToday: nextCount });
    return nextCount;
  }, [settings.adWatchDate, settings.adWatchCountToday, updateSettings]);

  // Awards the one-time Friend Duel referral bonus to THIS device the first
  // time it ever sees a completed duel (its own or a friend's) — both the
  // inviter's device and the accepter's device independently detect this
  // when they check their own duel status, so both sides get rewarded
  // without any extra backend logic. `firstDuelBonusClaimed` guarantees it
  // only ever fires once per device.
  const claimFirstDuelBonus = useCallback(async (): Promise<boolean> => {
    if (settings.firstDuelBonusClaimed) return false;
    await updateSettings({ firstDuelBonusClaimed: true });
    await earnCoins(DUEL_REFERRAL_BONUS_COINS);
    return true;
  }, [settings.firstDuelBonusClaimed, updateSettings, earnCoins]);

  const maybeRequestRating = useCallback(async (): Promise<void> => {
    if (!shouldPromptForRating(settings.lastRatingPromptAt)) return;
    await updateSettings({ lastRatingPromptAt: Date.now() });
    await requestAppReview();
  }, [settings.lastRatingPromptAt, updateSettings]);

  const disableNotifications = useCallback(async () => {
    await updateSettings({ notificationsEnabled: false });
    await cancelAllReminders();
  }, [updateSettings]);

  // Creates a fresh friend link and returns its share code, or null if
  // already linked or Supabase isn't configured. This device becomes
  // device_a; a friend joins with joinFriendStreak(code) to become device_b.
  const createFriendStreak = useCallback(async (): Promise<string | null> => {
    if (settings.friendLinkId) return settings.friendLinkCode;
    const result = await createFriendStreakRequest();
    if (!result) return null;
    await updateSettings({ friendLinkId: result.linkId, friendLinkCode: result.code });
    return result.code;
  }, [settings.friendLinkId, settings.friendLinkCode, updateSettings]);

  const joinFriendStreak = useCallback(
    async (code: string): Promise<boolean> => {
      if (settings.friendLinkId) return true;
      const result = await joinFriendStreakRequest(code);
      if (!result) return false;
      await updateSettings({ friendLinkId: result.linkId, friendLinkCode: null });
      return true;
    },
    [settings.friendLinkId, updateSettings]
  );

  const resetProgress = useCallback(async () => {
    await resetAllData();
    await cancelAllReminders();
    unlockTimestampsRef.current = {};
    setSessions([]);
    setCoins(0);
    setUnlockedCosmetics([DEFAULT_RING_COLOR_ID]);
    setUnlockedPersonas([DEFAULT_PERSONA_ID]);
    setSettings((prev) => ({
      ...prev,
      lastSelectedGoalMs: DEFAULT_SETTINGS.lastSelectedGoalMs,
      selectedRingColorId: DEFAULT_RING_COLOR_ID,
      personaId: DEFAULT_PERSONA_ID,
    }));
  }, []);

  const value: AppDataContextValue = {
    loading,
    settings,
    sessions,
    stats,
    achievements,
    coins,
    unlockedCosmetics,
    unlockedPersonas,
    isPremium,
    refreshPremiumStatus,
    updateSettings,
    beginActiveSession,
    completeSession,
    earnCoins,
    spendCoins,
    saveStreakWithInsurance,
    saveStreakWithCoins,
    buyStreakFreeze,
    unlockCosmetic,
    requestNotificationsPermission,
    disableNotifications,
    requestTracking,
    recordAdWatched,
    claimFirstDuelBonus,
    maybeRequestRating,
    createFriendStreak,
    joinFriendStreak,
    selectPersona,
    unlockPersonaWithCoins,
    resetProgress,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
