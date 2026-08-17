import { dangerColors } from '../theme';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface DangerLevel {
  id: string;
  label: string;
  thresholdMs: number;
  color: string;
  pulseDurationMs: number;
  haptic: HapticIntensity;
}

// Ordered ascending by thresholdMs — the active level is the last one whose
// threshold has been reached by the current elapsed time.
export const DANGER_LEVELS: DangerLevel[] = [
  { id: 'safe', label: 'SAFE', thresholdMs: 0, color: dangerColors.safe, pulseDurationMs: 2600, haptic: 'light' },
  { id: 'focus', label: 'FOCUS', thresholdMs: 5 * 60 * 1000, color: dangerColors.focus, pulseDurationMs: 2200, haptic: 'light' },
  { id: 'danger', label: 'DANGER', thresholdMs: 10 * 60 * 1000, color: dangerColors.danger, pulseDurationMs: 1700, haptic: 'medium' },
  { id: 'extreme', label: 'EXTREME', thresholdMs: 20 * 60 * 1000, color: dangerColors.extreme, pulseDurationMs: 1200, haptic: 'medium' },
  { id: 'insane', label: 'INSANE', thresholdMs: 30 * 60 * 1000, color: dangerColors.insane, pulseDurationMs: 850, haptic: 'heavy' },
  { id: 'untouchable', label: 'UNTOUCHABLE', thresholdMs: 60 * 60 * 1000, color: dangerColors.untouchable, pulseDurationMs: 600, haptic: 'heavy' },
];

export function getDangerLevel(elapsedMs: number): DangerLevel {
  let current = DANGER_LEVELS[0];
  for (const level of DANGER_LEVELS) {
    if (elapsedMs >= level.thresholdMs) current = level;
  }
  return current;
}
