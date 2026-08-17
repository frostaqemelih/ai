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
  resetAllData,
  saveAchievementUnlocks,
  saveCoins,
  saveSettings,
  saveUnlockedCosmetics,
  setActiveSession,
} from '../storage/storage';
import { deriveAchievements, deriveStats, findNewlyUnlocked } from '../storage/statsEngine';
import { DEFAULT_SETTINGS } from '../storage/storage';
import { baseCoinsForSession, DEFAULT_RING_COLOR_ID, STREAK_FREEZE_COST } from '../utils/economy';
import type { CustomerInfo, CustomerInfoUpdateListener } from 'react-native-purchases';
import {
  addCustomerInfoListener,
  configurePurchases,
  getCustomerInfoSafe,
  isEntitled,
  removeCustomerInfoListener,
} from '../services/purchasesService';

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
}

interface AppDataContextValue {
  loading: boolean;
  settings: AppSettings;
  sessions: SessionRecord[];
  stats: DerivedStats;
  achievements: AchievementState[];
  coins: number;
  unlockedCosmetics: string[];
  isPremium: boolean;
  refreshPremiumStatus: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  beginActiveSession: (goalMs: number) => Promise<number>;
  completeSession: (input: CompleteSessionInput) => Promise<CompleteSessionResult>;
  earnCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  saveStreakWithInsurance: () => Promise<void>;
  saveStreakWithCoins: () => Promise<boolean>;
  unlockCosmetic: (id: string, cost: number) => Promise<boolean>;
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
  const [isPremium, setIsPremium] = useState(false);
  const unlockTimestampsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const [
        loadedSettings,
        loadedSessions,
        loadedUnlocks,
        leftoverActive,
        loadedCoins,
        loadedCosmetics,
      ] = await Promise.all([
        loadSettings(),
        loadSessions(),
        loadAchievementUnlocks(),
        loadActiveSession(),
        loadCoins(),
        loadUnlockedCosmetics(),
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
      setLoading(false);
    })();
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    const info = await getCustomerInfoSafe();
    setIsPremium(isEntitled(info));
  }, []);

  useEffect(() => {
    let listener: CustomerInfoUpdateListener | null = null;
    (async () => {
      await configurePurchases();
      await refreshPremiumStatus();
      listener = (info: CustomerInfo) => setIsPremium(isEntitled(info));
      addCustomerInfoListener(listener);
    })();
    return () => {
      if (listener) removeCustomerInfoListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const nextSessions = await appendSession(sessions, record);
      setSessions(nextSessions);

      const nextStats = deriveStats(nextSessions);
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
      }

      const newlyUnlocked = nextAchievements.filter((a) => newlyUnlockedIds.includes(a.id));

      const coinsEarned = baseCoinsForSession(record.durationMs, record.completed);
      if (coinsEarned > 0) {
        await earnCoins(coinsEarned);
      }

      const streakBroken = !completed && previousStreak > 0 && nextStats.currentStreak < previousStreak;

      return {
        record,
        isNewRecord: record.durationMs > previousBest,
        newlyUnlocked,
        coinsEarned,
        streakBroken,
      };
    },
    [sessions, stats.personalBestMs, stats.currentStreak, earnCoins]
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
    const nextSessions = await appendSession(sessions, record);
    setSessions(nextSessions);
  }, [sessions]);

  const saveStreakWithInsurance = useCallback(async () => {
    await grantStreakSave();
  }, [grantStreakSave]);

  const saveStreakWithCoins = useCallback(async (): Promise<boolean> => {
    const success = await spendCoins(STREAK_FREEZE_COST);
    if (!success) return false;
    await grantStreakSave();
    return true;
  }, [spendCoins, grantStreakSave]);

  const resetProgress = useCallback(async () => {
    await resetAllData();
    unlockTimestampsRef.current = {};
    setSessions([]);
    setCoins(0);
    setUnlockedCosmetics([DEFAULT_RING_COLOR_ID]);
    setSettings((prev) => ({
      ...prev,
      lastSelectedGoalMs: DEFAULT_SETTINGS.lastSelectedGoalMs,
      selectedRingColorId: DEFAULT_RING_COLOR_ID,
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
    isPremium,
    refreshPremiumStatus,
    updateSettings,
    beginActiveSession,
    completeSession,
    earnCoins,
    spendCoins,
    saveStreakWithInsurance,
    saveStreakWithCoins,
    unlockCosmetic,
    resetProgress,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
