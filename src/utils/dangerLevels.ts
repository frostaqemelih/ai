import type { Persona, PersonaDangerColors } from '../personas/types';

export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type DangerLevelId = keyof PersonaDangerColors;

export interface DangerLevel {
  id: DangerLevelId;
  thresholdMs: number;
  color: string;
  pulseDurationMs: number;
  haptic: HapticIntensity;
}

// Structural thresholds only — these never change per persona (rule: don't
// touch session-ending/timing logic in Faz 9). Only the color (and the
// label, resolved separately via i18n as `personas.<id>.dangerLabels.<id>`)
// vary by persona. Ordered ascending by thresholdMs — the active level is
// the last one whose threshold has been reached by the current elapsed time.
const DANGER_THRESHOLDS: Array<Pick<DangerLevel, 'id' | 'thresholdMs' | 'pulseDurationMs' | 'haptic'>> = [
  { id: 'safe', thresholdMs: 0, pulseDurationMs: 2600, haptic: 'light' },
  { id: 'focus', thresholdMs: 5 * 60 * 1000, pulseDurationMs: 2200, haptic: 'light' },
  { id: 'danger', thresholdMs: 10 * 60 * 1000, pulseDurationMs: 1700, haptic: 'medium' },
  { id: 'extreme', thresholdMs: 20 * 60 * 1000, pulseDurationMs: 1200, haptic: 'medium' },
  { id: 'insane', thresholdMs: 30 * 60 * 1000, pulseDurationMs: 850, haptic: 'heavy' },
  { id: 'untouchable', thresholdMs: 60 * 60 * 1000, pulseDurationMs: 600, haptic: 'heavy' },
  { id: 'transcendent', thresholdMs: 90 * 60 * 1000, pulseDurationMs: 450, haptic: 'heavy' },
  { id: 'eternal', thresholdMs: 120 * 60 * 1000, pulseDurationMs: 320, haptic: 'heavy' },
];

export function getDangerLevel(elapsedMs: number, persona: Persona): DangerLevel {
  let current = DANGER_THRESHOLDS[0];
  for (const level of DANGER_THRESHOLDS) {
    if (elapsedMs >= level.thresholdMs) current = level;
  }
  return { ...current, color: persona.dangerColors[current.id] };
}
