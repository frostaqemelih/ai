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

export function ringColorForId(id: string): string {
  return COSMETIC_RING_COLORS.find((c) => c.id === id)?.color ?? COSMETIC_RING_COLORS[0].color;
}
