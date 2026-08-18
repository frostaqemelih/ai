export type PersonaId = 'ruthless' | 'calm' | 'playful' | 'coach' | 'monk';

export interface PersonaDangerColors {
  safe: string;
  focus: string;
  danger: string;
  extreme: string;
  insane: string;
  untouchable: string;
  transcendent: string;
  eternal: string;
}

export type PersonaUnlock = { type: 'free' } | { type: 'coins'; cost: number } | { type: 'premium' };

export interface CosmeticRingVariant {
  id: string;
  label: string;
  color: string;
  cost: number;
  /** Requires an active Premium subscription regardless of coin balance —
   *  same rule as a premium-only persona, kept independent of it. */
  premiumOnly?: boolean;
}

export interface Persona {
  id: PersonaId;
  /** Primary accent — streak badges, share card highlight, selected-state UI. */
  accent: string;
  dangerColors: PersonaDangerColors;
  /** Scales haptic impact style selection in SessionScreen (1 = unchanged,
   *  lower = softer). Never raises intensity above what dangerLevels.ts's
   *  own thresholds already assign — only allowed to soften. */
  hapticMultiplier: number;
  unlock: PersonaUnlock;
  /** Idle-screen ring color options owned by this persona (Faz 10-E —
   *  cosmetics live inside the persona that "wears" them, not a separate
   *  persona-independent list). Index 0 is always this persona's own free
   *  default (its `accent`) so every persona has an immediate, unpaid look. */
  ringVariants: CosmeticRingVariant[];
}
