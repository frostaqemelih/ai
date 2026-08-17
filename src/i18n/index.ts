import { useMemo } from 'react';
import * as Localization from 'expo-localization';
import en from './en.json';
import tr from './tr.json';
import { useAppData } from '../context/AppDataContext';
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

// Only the "core" screens (Home, Onboarding, Session, SessionResult, Paywall)
// are covered — see the Faz 6 summary for the remaining TODO screens.
export function useTranslation() {
  const { settings } = useAppData();
  const locale = resolveLocale(settings.languageCode);

  return useMemo(() => {
    const catalog = CATALOGS[locale];
    const t = (key: string, vars?: Record<string, string | number>): string => {
      const value = getNested(catalog, key.split('.'));
      if (typeof value !== 'string') return key;
      return interpolate(value, vars);
    };
    return { t, locale };
  }, [locale]);
}
