import { useMemo } from 'react';
import * as Localization from 'expo-localization';
import en from './en.json';
import tr from './tr.json';
import { useLanguageCode } from '../context/LocaleContext';
import type { AppSettings } from '../types';

export type SupportedLocale = 'en' | 'tr';

const CATALOGS: Record<SupportedLocale, typeof en> = { en, tr };

function getDeviceLocale(): SupportedLocale {
  try {
    const code = Localization.getLocales()[0]?.languageCode;
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLocale(languageCode: AppSettings['languageCode']): SupportedLocale {
  if (languageCode === 'en' || languageCode === 'tr') return languageCode;
  return getDeviceLocale();
}

function getNested(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : match;
  });
}

// Plain (non-hook) lookup — used by code that can't call the useTranslation
// hook because it would be circular (AppDataContext itself calls this
// directly, since useTranslation calls useAppData() internally). Same
// catalog/interpolation logic as the hook below, just without the
// useMemo/settings wiring.
export function translateSync(
  locale: SupportedLocale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const value = getNested(CATALOGS[locale], key.split('.'));
  if (typeof value !== 'string') return key;
  return interpolate(value, vars);
}

export function useTranslation() {
  const languageCode = useLanguageCode();
  const locale = resolveLocale(languageCode);

  return useMemo(() => {
    const t = (key: string, vars?: Record<string, string | number>): string =>
      translateSync(locale, key, vars);
    // For catalog entries that are arrays (e.g. a persona's temptation
    // message pool) rather than a single string.
    const list = (key: string): string[] => {
      const value = getNested(CATALOGS[locale], key.split('.'));
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
    };
    return { t, list, locale };
  }, [locale]);
}
