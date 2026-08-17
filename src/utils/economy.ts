// 1 coin per minute survived on a completed run, minimum 1. Failed and
// streak-saved runs earn nothing — coins reward reaching the goal.
export function baseCoinsForSession(durationMs: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.max(1, Math.floor(durationMs / 60000));
}

// Spend coins to save a broken streak instantly, without watching an ad.
export const STREAK_FREEZE_COST = 50;

export interface CosmeticRingColor {
  id: string;
  label: string;
  color: string;
  cost: number;
}

// Coin sink: cosmetic timer-ring colors for the idle Home screen. Purely
// visual — no gameplay advantage, so this never has to touch danger-level
// colors (those stay functional, tied to session state).
export const COSMETIC_RING_COLORS: CosmeticRingColor[] = [
  { id: 'classic', label: 'Classic', color: '#F5F5F7', cost: 0 },
  { id: 'ocean', label: 'Ocean', color: '#5AC8FA', cost: 100 },
  { id: 'ember', label: 'Ember', color: '#FF8A3D', cost: 100 },
  { id: 'violet', label: 'Violet', color: '#C084FC', cost: 150 },
  { id: 'mint', label: 'Mint', color: '#4ADE80', cost: 150 },
];

export const DEFAULT_RING_COLOR_ID = 'classic';

export function ringColorForId(id: string): string {
  return COSMETIC_RING_COLORS.find((c) => c.id === id)?.color ?? COSMETIC_RING_COLORS[0].color;
}
