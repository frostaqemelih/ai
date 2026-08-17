// 1 coin per minute survived on a completed run, minimum 1. Failed and
// streak-saved runs earn nothing — coins reward reaching the goal.
export function baseCoinsForSession(durationMs: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.max(1, Math.floor(durationMs / 60000));
}

// Spend coins to save a broken streak instantly, without watching an ad.
export const STREAK_FREEZE_COST = 50;

// One-time bonus awarded to a device the first time it ever sees a
// completed Friend Duel (as inviter or accepter) — see
// AppDataContext.claimFirstDuelBonus.
export const DUEL_REFERRAL_BONUS_COINS = 100;

export interface CosmeticRingColor {
  id: string;
  label: string;
  color: string;
  cost: number;
  /** Requires an active Premium subscription regardless of coin balance —
   *  keeps the coin economy and the subscription tier from competing. */
  premiumOnly?: boolean;
}

// Coin sink: cosmetic timer-ring colors for the idle Home screen. Purely
// visual — no gameplay advantage, so this never has to touch danger-level
// colors (those stay functional, tied to session state).
export const COSMETIC_RING_COLORS: CosmeticRingColor[] = [
  { id: 'classic', label: 'Classic', color: '#F5F5F7', cost: 0 },
  { id: 'ocean', label: 'Ocean', color: '#5AC8FA', cost: 100 },
  { id: 'ember', label: 'Ember', color: '#FF8A3D', cost: 100 },
  { id: 'violet', label: 'Violet', color: '#C084FC', cost: 150 },
  { id: 'gold', label: 'Gold', color: '#FFD84D', cost: 0, premiumOnly: true },
];

export const DEFAULT_RING_COLOR_ID = 'classic';

// Dedicated RevenueCat offering (configured separately from the "current"
// Premium offering) holding the consumable coin-pack products.
export const COIN_OFFERING_ID = 'coins';

export interface CoinPackageDef {
  /** Must exactly match the Package identifier configured in RevenueCat. */
  packageIdentifier: string;
  coins: number;
}

// The coin amount per pack is defined here rather than parsed from store
// metadata (fragile) — RevenueCat dashboard package identifiers must match
// these exactly. Prices themselves always come from the real store product,
// never hardcoded.
export const COIN_IAP_PACKAGES: CoinPackageDef[] = [
  { packageIdentifier: 'coins_small', coins: 500 },
  { packageIdentifier: 'coins_medium', coins: 1500 },
  { packageIdentifier: 'coins_large', coins: 5000 },
];

export function coinsForPackageIdentifier(identifier: string): number | null {
  return COIN_IAP_PACKAGES.find((p) => p.packageIdentifier === identifier)?.coins ?? null;
}

// Streak lengths (in days) that count as a celebration-worthy milestone —
// shared between the share card's highlight badge and the streak reward
// ladder (AppDataContext.completeSession) so the two stay in sync.
export const STREAK_MILESTONE_DAYS: number[] = [7, 30, 100, 365];

// Coin reward granted the first time a streak reaches each milestone day —
// escalating well past a single day's normal coin yield so it reads as a
// real celebration, not routine income.
export const STREAK_MILESTONE_REWARDS: Record<number, number> = {
  7: 100,
  30: 300,
  100: 1000,
  365: 5000,
};

export function isStreakMilestoneDay(streak: number): boolean {
  return STREAK_MILESTONE_DAYS.includes(streak);
}

export interface StreakMilestoneResult {
  claimed: number[];
  milestone: { day: number; coins: number } | null;
}

// Pure milestone-crossing check shared by every path that can grow the
// streak (a normal completed session, or a streak-insurance/freeze save) —
// keeps the "claim once per unbroken streak" rule consistent everywhere.
export function checkStreakMilestone(
  previousStreak: number,
  nextStreak: number,
  previouslyClaimed: number[]
): StreakMilestoneResult {
  const streakReset = nextStreak < previousStreak || nextStreak === 0;
  let claimed = streakReset ? [] : previouslyClaimed;

  const newlyCrossedDay = STREAK_MILESTONE_DAYS.find(
    (day) => nextStreak >= day && previousStreak < day && !claimed.includes(day)
  );

  if (newlyCrossedDay === undefined) {
    return { claimed, milestone: null };
  }

  claimed = [...claimed, newlyCrossedDay];
  return { claimed, milestone: { day: newlyCrossedDay, coins: STREAK_MILESTONE_REWARDS[newlyCrossedDay] } };
}

export function ringColorForId(id: string): string {
  return COSMETIC_RING_COLORS.find((c) => c.id === id)?.color ?? COSMETIC_RING_COLORS[0].color;
}
