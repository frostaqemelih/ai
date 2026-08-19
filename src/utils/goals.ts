import type { SupportedLocale } from '../i18n';

export interface GoalPreset {
  minutes: number;
  ms: number;
}

export const GOAL_PRESETS: GoalPreset[] = [
  { minutes: 1, ms: 1 * 60 * 1000 },
  { minutes: 5, ms: 5 * 60 * 1000 },
  { minutes: 10, ms: 10 * 60 * 1000 },
  { minutes: 15, ms: 15 * 60 * 1000 },
  { minutes: 30, ms: 30 * 60 * 1000 },
  { minutes: 60, ms: 60 * 60 * 1000 },
];

export const DEFAULT_GOAL_MS = GOAL_PRESETS[1].ms; // 5 minutes

export const MIN_CUSTOM_MINUTES = 1;
// Free tier caps custom runs at 1 hour — Premium unlocks the full 24-hour range.
export const FREE_MAX_CUSTOM_MINUTES = 60;
export const MAX_CUSTOM_MINUTES = 24 * 60;

export function maxCustomMinutesFor(isPremium: boolean): number {
  return isPremium ? MAX_CUSTOM_MINUTES : FREE_MAX_CUSTOM_MINUTES;
}

const UNIT_WORDS: Record<SupportedLocale, { minute: string; minutes: string; hour: string; minAbbr: string; hourAbbr: string }> = {
  en: { minute: 'MINUTE', minutes: 'MINUTES', hour: 'HOUR', minAbbr: 'MIN', hourAbbr: 'HR' },
  tr: { minute: 'DAKİKA', minutes: 'DAKİKA', hour: 'SAAT', minAbbr: 'DK', hourAbbr: 'SAAT' },
};

// Full-word form ("5 MINUTES", "1 HOUR") — used for goal presets, where the
// duration is always a round number of minutes or exactly one hour.
export function goalPresetLabel(preset: GoalPreset, locale: SupportedLocale): string {
  const words = UNIT_WORDS[locale];
  if (preset.minutes < 60) {
    const unit = preset.minutes === 1 ? words.minute : words.minutes;
    return `${preset.minutes} ${unit}`;
  }
  const hours = preset.minutes / 60;
  return `${hours} ${words.hour}`;
}

// Abbreviated form ("45 MIN", "2H 30M") — used for arbitrary/custom
// durations that don't match a preset, where the full-word form would run
// long (e.g. share-card copy, compact chips).
export function goalLabelForMs(ms: number, locale: SupportedLocale): string {
  const preset = GOAL_PRESETS.find((g) => g.ms === ms);
  if (preset) return goalPresetLabel(preset, locale);
  const words = UNIT_WORDS[locale];
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} ${words.minAbbr}`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} ${words.hourAbbr}` : `${hours}${words.hourAbbr[0]} ${rem}${words.minAbbr[0]}`;
}
