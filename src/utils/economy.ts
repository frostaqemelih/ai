import { DEFAULT_PERSONA_ID, getPersona } from '../personas';
import type { CosmeticRingVariant, PersonaId } from '../personas/types';

// 1 coin per minute survived on a completed run, minimum 1. Failed and
// streak-saved runs earn nothing — coins reward reaching the goal.
export function baseCoinsForSession(durationMs: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.max(1, Math.floor(durationMs / 60000));
}

// Spend coins to save a broken streak instantly, without watching an ad.
// Also the price of pre-buying one stockpiled freeze in the Store — the
// same "50 coins buys one save" economy, whether spent reactively in the
// moment or proactively ahead of time.
export const STREAK_FREEZE_COST = 50;

// Stockpile caps for pre-bought freezes (Duolingo-style) — auto-consumed by
// completeSession the instant a streak would otherwise break, no ad or
// reactive coin spend required. Premium gets a bigger cushion, matching the
// tier's "less friction" positioning without being unlimited.
export const STREAK_FREEZE_FREE_CAP = 2;
export const STREAK_FREEZE_PREMIUM_CAP = 5;

export function streakFreezeCap(isPremium: boolean): number {
  return isPremium ? STREAK_FREEZE_PREMIUM_CAP : STREAK_FREEZE_FREE_CAP;
}

// One-time bonus awarded to a device the first time it ever sees a
// completed Friend Duel (as inviter or accepter) — see
// AppDataContext.claimFirstDuelBonus.
export const DUEL_REFERRAL_BONUS_COINS = 100;

// Idle-screen ring color cosmetics (Faz 10-E) live inside each persona's
// own `ringVariants` (src/personas) rather than a persona-independent list —
// a ring color is owned by the persona that wears it, so switching persona
// switches which ring options are even on offer. See ringVariantsForPersona
// / ringColorForSelection below for the read side of that.
export const DEFAULT_RING_COLOR_ID = `${DEFAULT_PERSONA_ID}-default`;

export function ringVariantsForPersona(personaId: PersonaId): CosmeticRingVariant[] {
  return getPersona(personaId).ringVariants;
}

// Resolves the actual color for a stored selectedRingColorId, scoped to
// whichever persona is currently active. Falls back to that persona's own
// default variant (always present, always free) if the stored id belonged
// to a different persona — e.g. right after switching personas.
export function ringColorForSelection(personaId: PersonaId, selectedRingColorId: string): string {
  const variants = ringVariantsForPersona(personaId);
  return (
    variants.find((v) => v.id === selectedRingColorId)?.color ??
    variants[0]?.color ??
    getPersona(personaId).accent
  );
}

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
