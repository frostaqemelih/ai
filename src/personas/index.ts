import type { Persona, PersonaId } from './types';

export type { Persona, PersonaId, PersonaDangerColors, PersonaUnlock } from './types';

// All persona identity, tone, and copy lives in two places: this file (id,
// color, haptic softening, unlock rule — anything a screen needs before
// text is even involved) and src/i18n/{en,tr}.json under `personas.<id>.*`
// (name, description, danger labels, temptations, result/milestone copy).
// Session-ending logic, streak math, and achievement rules are untouched —
// this is presentation only.
export const PERSONAS: Record<PersonaId, Persona> = {
  ruthless: {
    id: 'ruthless',
    accent: '#FF5C4D',
    dangerColors: {
      safe: '#8A8A8F',
      focus: '#5AC8FA',
      danger: '#FFB84D',
      extreme: '#FF6B4D',
      insane: '#FF3B5C',
      untouchable: '#C084FC',
      transcendent: '#E040FB',
      eternal: '#FFFFFF',
    },
    hapticMultiplier: 1,
    unlock: { type: 'free' },
  },
  calm: {
    id: 'calm',
    accent: '#4ADE80',
    dangerColors: {
      safe: '#6B7280',
      focus: '#7DD3FC',
      danger: '#93C5FD',
      extreme: '#67E8F9',
      insane: '#5EEAD4',
      untouchable: '#34D399',
      transcendent: '#A7F3D0',
      eternal: '#ECFDF5',
    },
    hapticMultiplier: 0.5,
    unlock: { type: 'free' },
  },
  playful: {
    id: 'playful',
    accent: '#FF6FB5',
    dangerColors: {
      safe: '#A78BFA',
      focus: '#F472B6',
      danger: '#FB923C',
      extreme: '#FBBF24',
      insane: '#F87171',
      untouchable: '#C084FC',
      transcendent: '#F0ABFC',
      eternal: '#FDF4FF',
    },
    hapticMultiplier: 1,
    unlock: { type: 'free' },
  },
  coach: {
    id: 'coach',
    accent: '#FFB300',
    dangerColors: {
      safe: '#60A5FA',
      focus: '#34D399',
      danger: '#FBBF24',
      extreme: '#FB923C',
      insane: '#F97316',
      untouchable: '#FFD54D',
      transcendent: '#FFECB3',
      eternal: '#FFFDE7',
    },
    hapticMultiplier: 1,
    unlock: { type: 'coins', cost: 400 },
  },
  monk: {
    id: 'monk',
    accent: '#8B5CF6',
    dangerColors: {
      safe: '#71717A',
      focus: '#A1A1AA',
      danger: '#C4B5FD',
      extreme: '#A78BFA',
      insane: '#8B5CF6',
      untouchable: '#6D28D9',
      transcendent: '#4C1D95',
      eternal: '#FAFAFA',
    },
    hapticMultiplier: 0.4,
    unlock: { type: 'premium' },
  },
};

export const PERSONA_ORDER: PersonaId[] = ['ruthless', 'calm', 'playful', 'coach', 'monk'];
export const DEFAULT_PERSONA_ID: PersonaId = 'ruthless';
export const FREE_PERSONA_IDS: PersonaId[] = ['ruthless', 'calm', 'playful'];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id] ?? PERSONAS[DEFAULT_PERSONA_ID];
}

// A persona is usable right now if it's free, already coin-unlocked, or
// premium-gated and the device currently has Premium. Coin unlocking is
// permanent (mirrors unlockedCosmetics) — losing Premium later does NOT
// revoke a coin-bought persona, but DOES re-lock a premium-only one.
export function isPersonaUnlocked(
  id: PersonaId,
  unlockedPersonaIds: string[],
  isPremium: boolean
): boolean {
  const persona = getPersona(id);
  if (persona.unlock.type === 'free') return true;
  if (persona.unlock.type === 'premium') return isPremium;
  return unlockedPersonaIds.includes(id);
}
