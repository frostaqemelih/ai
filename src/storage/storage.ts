import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActiveSession, AppSettings, SessionRecord } from '../types';
import { DEFAULT_GOAL_MS } from '../utils/goals';
import { DEFAULT_RING_COLOR_ID } from '../utils/economy';
import { DEFAULT_PERSONA_ID } from '../personas';
import { reportError } from '../services/crashService';

const KEYS = {
  sessions: '@dt/sessions',
  settings: '@dt/settings',
  achievementUnlocks: '@dt/achievementUnlocks',
  activeSession: '@dt/activeSession',
  coins: '@dt/coins',
  unlockedCosmetics: '@dt/unlockedCosmetics',
  unlockedPersonas: '@dt/unlockedPersonas',
  creditedTransactionIds: '@dt/creditedTransactionIds',
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
  friendLinkId: null,
  friendLinkCode: null,
  streakFreezesOwned: 0,
  keepScreenAwakeEnabled: true,
  personaId: DEFAULT_PERSONA_ID,
  schedule: null,
  scheduleHintDismissed: false,
  onboardingGoalReason: null,
  firstSessionPaywallShown: false,
};

// Cap stored history so device storage never grows unbounded.
const MAX_STORED_SESSIONS = 1000;

// Every load*()/save*() function below goes through these instead of
// calling AsyncStorage directly. A JSON.parse failure (corrupt data) was
// already handled per-function, but the AsyncStorage.getItem/setItem/
// removeItem call itself can also reject — a real native storage error
// (full disk, a corrupt underlying SQLite db on Android, etc.), not
// malformed data. Before this, that rejection wasn't caught anywhere,
// including AppDataContext's boot Promise.all, which meant setLoading(false)
// would never run and the app would hang on a blank screen forever (Faz 13
// finding). These wrappers report the failure to Sentry (visible, not
// silently swallowed) and resolve to the same "nothing was there" shape
// every caller already treats as the signal to fall back to its default.
async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (err) {
    reportError(err, { storageKey: key, op: 'getItem' });
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    reportError(err, { storageKey: key, op: 'setItem' });
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    reportError(err, { storageKey: key, op: 'removeItem' });
  }
}

async function safeMultiRemove(keys: readonly string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys as string[]);
  } catch (err) {
    reportError(err, { storageKeys: keys, op: 'multiRemove' });
  }
}

export async function loadSessions(): Promise<SessionRecord[]> {
  const raw = await safeGetItem(KEYS.sessions);
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
  await safeSetItem(KEYS.sessions, JSON.stringify(next));
  return next;
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await safeGetItem(KEYS.settings);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await safeSetItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadAchievementUnlocks(): Promise<Record<string, number>> {
  const raw = await safeGetItem(KEYS.achievementUnlocks);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveAchievementUnlocks(unlocks: Record<string, number>): Promise<void> {
  await safeSetItem(KEYS.achievementUnlocks, JSON.stringify(unlocks));
}

export async function loadActiveSession(): Promise<ActiveSession | null> {
  const raw = await safeGetItem(KEYS.activeSession);
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
  await safeSetItem(KEYS.activeSession, JSON.stringify(session));
}

export async function clearActiveSession(): Promise<void> {
  await safeRemoveItem(KEYS.activeSession);
}

export async function loadCoins(): Promise<number> {
  const raw = await safeGetItem(KEYS.coins);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function saveCoins(coins: number): Promise<void> {
  await safeSetItem(KEYS.coins, String(Math.max(0, Math.floor(coins))));
}

export async function loadUnlockedCosmetics(): Promise<string[]> {
  const raw = await safeGetItem(KEYS.unlockedCosmetics);
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
  await safeSetItem(KEYS.unlockedCosmetics, JSON.stringify(ids));
}

export async function loadUnlockedPersonas(): Promise<string[]> {
  const raw = await safeGetItem(KEYS.unlockedPersonas);
  if (!raw) return [DEFAULT_PERSONA_ID];
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [DEFAULT_PERSONA_ID];
    return parsed.includes(DEFAULT_PERSONA_ID) ? parsed : [DEFAULT_PERSONA_ID, ...parsed];
  } catch {
    return [DEFAULT_PERSONA_ID];
  }
}

export async function saveUnlockedPersonas(ids: string[]): Promise<void> {
  await safeSetItem(KEYS.unlockedPersonas, JSON.stringify(ids));
}

// RevenueCat transaction identifiers already credited toward the coin
// balance — the coin-purchase reconciliation loop's idempotency ledger
// (see AppDataContext.reconcileCoinPurchases). A corrupt/unreadable ledger
// must never crash or block reconciliation — worst case it re-derives an
// empty ledger and re-credits already-seen transactions once, which is far
// safer than never being able to credit a genuine purchase again.
export async function loadCreditedTransactionIds(): Promise<string[]> {
  const raw = await safeGetItem(KEYS.creditedTransactionIds);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCreditedTransactionIds(ids: string[]): Promise<void> {
  await safeSetItem(KEYS.creditedTransactionIds, JSON.stringify(ids));
}

export async function resetAllData(): Promise<void> {
  // Deliberately NOT clearing KEYS.creditedTransactionIds here. Wiping it
  // would make the next boot's reconciliation see old, already-owned
  // RevenueCat coin transactions as "new" again and re-grant coins the
  // user already spent — quietly contradicting the "consumables aren't
  // restored" disclosure in StoreScreen/Terms. Leaving the ledger intact
  // means a reset genuinely forfeits those coins, matching what users were
  // told.
  await safeMultiRemove([
    KEYS.sessions,
    KEYS.achievementUnlocks,
    KEYS.activeSession,
    KEYS.coins,
    KEYS.unlockedCosmetics,
    KEYS.unlockedPersonas,
  ]);
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    lastSelectedGoalMs: DEFAULT_GOAL_MS,
    selectedRingColorId: DEFAULT_RING_COLOR_ID,
    personaId: DEFAULT_PERSONA_ID,
  });
}
