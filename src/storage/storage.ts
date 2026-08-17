import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActiveSession, AppSettings, SessionRecord } from '../types';
import { DEFAULT_GOAL_MS } from '../utils/goals';
import { DEFAULT_RING_COLOR_ID } from '../utils/economy';

const KEYS = {
  sessions: '@dt/sessions',
  settings: '@dt/settings',
  achievementUnlocks: '@dt/achievementUnlocks',
  activeSession: '@dt/activeSession',
  coins: '@dt/coins',
  unlockedCosmetics: '@dt/unlockedCosmetics',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  hasOnboarded: false,
  soundEnabled: false,
  hapticsEnabled: true,
  lastSelectedGoalMs: DEFAULT_GOAL_MS,
  selectedRingColorId: DEFAULT_RING_COLOR_ID,
  premiumThemeEnabled: false,
  notificationsEnabled: false,
  notificationsPermissionAsked: false,
  trackingGranted: false,
  trackingPermissionAsked: false,
  firstDuelBonusClaimed: false,
  lastRatingPromptAt: null,
  languageCode: 'system',
  contributeToGlobalStats: false,
  adWatchDate: null,
  adWatchCountToday: 0,
  streakMilestonesClaimed: [],
};

// Cap stored history so device storage never grows unbounded.
const MAX_STORED_SESSIONS = 1000;

export async function loadSessions(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.sessions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function appendSession(
  sessions: SessionRecord[],
  record: SessionRecord
): Promise<SessionRecord[]> {
  const next = [...sessions, record].slice(-MAX_STORED_SESSIONS);
  await AsyncStorage.setItem(KEYS.sessions, JSON.stringify(next));
  return next;
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadAchievementUnlocks(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(KEYS.achievementUnlocks);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveAchievementUnlocks(unlocks: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(KEYS.achievementUnlocks, JSON.stringify(unlocks));
}

export async function loadActiveSession(): Promise<ActiveSession | null> {
  const raw = await AsyncStorage.getItem(KEYS.activeSession);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveSession;
    if (typeof parsed.startedAt !== 'number' || typeof parsed.goalMs !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setActiveSession(session: ActiveSession): Promise<void> {
  await AsyncStorage.setItem(KEYS.activeSession, JSON.stringify(session));
}

export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.activeSession);
}

export async function loadCoins(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.coins);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function saveCoins(coins: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.coins, String(Math.max(0, Math.floor(coins))));
}

export async function loadUnlockedCosmetics(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.unlockedCosmetics);
  if (!raw) return [DEFAULT_RING_COLOR_ID];
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [DEFAULT_RING_COLOR_ID];
    return parsed.includes(DEFAULT_RING_COLOR_ID) ? parsed : [DEFAULT_RING_COLOR_ID, ...parsed];
  } catch {
    return [DEFAULT_RING_COLOR_ID];
  }
}

export async function saveUnlockedCosmetics(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.unlockedCosmetics, JSON.stringify(ids));
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.sessions,
    KEYS.achievementUnlocks,
    KEYS.activeSession,
    KEYS.coins,
    KEYS.unlockedCosmetics,
  ]);
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    lastSelectedGoalMs: DEFAULT_GOAL_MS,
    selectedRingColorId: DEFAULT_RING_COLOR_ID,
  });
}
