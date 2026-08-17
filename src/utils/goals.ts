export interface GoalPreset {
  label: string;
  ms: number;
}

export const GOAL_PRESETS: GoalPreset[] = [
  { label: '1 MINUTE', ms: 1 * 60 * 1000 },
  { label: '5 MINUTES', ms: 5 * 60 * 1000 },
  { label: '10 MINUTES', ms: 10 * 60 * 1000 },
  { label: '15 MINUTES', ms: 15 * 60 * 1000 },
  { label: '30 MINUTES', ms: 30 * 60 * 1000 },
  { label: '1 HOUR', ms: 60 * 60 * 1000 },
];

export const DEFAULT_GOAL_MS = GOAL_PRESETS[1].ms; // 5 minutes

export const MIN_CUSTOM_MINUTES = 1;
// Free tier caps custom runs at 1 hour — Premium unlocks the full 24-hour range.
export const FREE_MAX_CUSTOM_MINUTES = 60;
export const MAX_CUSTOM_MINUTES = 24 * 60;

export function maxCustomMinutesFor(isPremium: boolean): number {
  return isPremium ? MAX_CUSTOM_MINUTES : FREE_MAX_CUSTOM_MINUTES;
}

export function goalLabelForMs(ms: number): string {
  const preset = GOAL_PRESETS.find((g) => g.ms === ms);
  if (preset) return preset.label;
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} HR` : `${hours}H ${rem}M`;
}
