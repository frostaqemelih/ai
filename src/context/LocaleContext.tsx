import { createContext, useContext } from 'react';
import type { AppSettings } from '../types';

// Exists purely to break a require cycle: i18n/index.ts's useTranslation()
// needs the current language setting, but importing useAppData from
// AppDataContext.tsx directly created AppDataContext -> i18n -> AppDataContext
// (Metro warns about this at bundle time — "Require cycle" — and depending
// on which side of the cycle evaluates first, a cyclically-imported binding
// can be captured as undefined, which is exactly what happened here: Faz
// 13-A's changes shifted module evaluation order and turned a previously
// "lucky" ordering into `key.split is not a function` inside translateSync).
// This tiny leaf module has no dependency on AppDataContext at all, so
// i18n/index.ts importing it creates no cycle. AppDataProvider supplies the
// value; useTranslation() (and anything else) can read it without ever
// importing AppDataContext.tsx.
export const LocaleContext = createContext<AppSettings['languageCode']>('system');

export function useLanguageCode(): AppSettings['languageCode'] {
  return useContext(LocaleContext);
}
