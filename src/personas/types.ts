export type PersonaId = 'ruthless' | 'calm' | 'playful' | 'coach' | 'monk';

export interface PersonaDangerColors {
  safe: string;
  focus: string;
  danger: string;
  extreme: string;
  insane: string;
  untouchable: string;
}

export type PersonaUnlock = { type: 'free' } | { type: 'coins'; cost: number } | { type: 'premium' };

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
}
