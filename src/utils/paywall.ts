import type { PurchasesPackage } from 'react-native-purchases';

function parseIsoPeriodCount(period: string): number {
  const match = /P(\d+)[DWMY]/.exec(period);
  return match ? parseInt(match[1], 10) : 1;
}

function periodUnitLabel(unit: string, count: number): string {
  const map: Record<string, string> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };
  const label = map[unit] ?? unit.toLowerCase();
  return count === 1 ? label : `${label}s`;
}

// Percent cheaper the annual package is per month, vs. the monthly package's
// price. Returns null if either package or the data needed is missing —
// never guess or hardcode a percentage.
export function computeAnnualSavingsPercent(
  monthly: PurchasesPackage | null,
  annual: PurchasesPackage | null
): number | null {
  if (!monthly || !annual) return null;
  const monthlyPrice = monthly.product.price;
  const annualPerMonth = annual.product.pricePerMonth;
  if (!monthlyPrice || annualPerMonth === null) return null;
  const pct = Math.round((1 - annualPerMonth / monthlyPrice) * 100);
  return pct > 0 ? pct : null;
}

const ISO_UNIT_TO_KEY: Record<string, string> = { D: 'DAY', W: 'WEEK', M: 'MONTH', Y: 'YEAR' };
const UNIT_TO_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function daysInIsoPeriod(period: string): number {
  const count = parseIsoPeriodCount(period);
  const unitChar = period.slice(-1);
  const unitKey = ISO_UNIT_TO_KEY[unitChar] ?? 'MONTH';
  return count * UNIT_TO_DAYS[unitKey];
}

function addDaysLabel(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface RenewalInfo {
  /** Lifetime / any non-recurring package — never renews, nothing to disclose beyond the price. */
  isOneTime: boolean;
  /** Has a free (price === 0) intro trial before the first real charge. */
  isFreeTrial: boolean;
  /** 'day' | 'week' | 'month' | 'year' — the recurring billing cadence, or null for one-time. */
  periodUnit: string | null;
  periodCount: number;
  /** What actually gets charged (today, or on the day the trial ends). */
  chargeAmount: string;
  /** Formatted date of that first real charge — null when it happens today (no trial). */
  chargeDateLabel: string | null;
}

// Renewal terms must be legible at a glance next to the package, not buried
// in fine print — this reads whatever RevenueCat/the store actually
// configured (never a hardcoded price or date) so the paywall can state
// plainly what gets charged, how often, and when the first real charge
// happens. See Faz 9 Bölüm D: unexpected subscription charges are the
// single largest complaint category in this app category.
export function getRenewalInfo(pkg: PurchasesPackage): RenewalInfo {
  const product = pkg.product;
  const rawPeriod = product.subscriptionPeriod;

  if (!rawPeriod) {
    return {
      isOneTime: true,
      isFreeTrial: false,
      periodUnit: null,
      periodCount: 0,
      chargeAmount: product.priceString,
      chargeDateLabel: null,
    };
  }

  const periodCount = parseIsoPeriodCount(rawPeriod);
  const periodUnitKey = ISO_UNIT_TO_KEY[rawPeriod.slice(-1)] ?? 'MONTH';
  const periodUnit = periodUnitLabel(periodUnitKey, 1); // unit name only, count handled separately

  const intro = product.introPrice;
  if (intro && intro.price === 0) {
    const trialDays = daysInIsoPeriod(intro.period);
    return {
      isOneTime: false,
      isFreeTrial: true,
      periodUnit,
      periodCount,
      chargeAmount: product.priceString,
      chargeDateLabel: addDaysLabel(trialDays),
    };
  }

  return {
    isOneTime: false,
    isFreeTrial: false,
    periodUnit,
    periodCount,
    chargeAmount: product.priceString,
    chargeDateLabel: null,
  };
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

// One-line, always-visible renewal disclosure (no fine print, no separate
// screen) — the whole point of Faz 9 Bölüm D. `t` is passed in rather than
// imported so this stays a plain testable function, matching the rest of
// this file.
export function describeRenewalTerms(pkg: PurchasesPackage, t: Translate): string {
  const info = getRenewalInfo(pkg);
  if (info.isOneTime) {
    return t('paywall.renewalOneTime', { price: info.chargeAmount });
  }
  const period = t(`paywall.period${(info.periodUnit ?? 'month').replace(/^./, (c) => c.toUpperCase())}`);
  if (info.isFreeTrial && info.chargeDateLabel) {
    return t('paywall.renewalTrial', { date: info.chargeDateLabel, price: info.chargeAmount, period });
  }
  return t('paywall.renewalRecurring', { price: info.chargeAmount, period });
}
