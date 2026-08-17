import type { PurchasesIntroPrice, PurchasesPackage } from 'react-native-purchases';

function parseIsoPeriodCount(period: string): number {
  const match = /P(\d+)[DWMY]/.exec(period);
  return match ? parseInt(match[1], 10) : 1;
}

function periodUnitLabel(unit: string, count: number): string {
  const map: Record<string, string> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };
  const label = map[unit] ?? unit.toLowerCase();
  return count === 1 ? label : `${label}s`;
}

// e.g. "3-day free trial" or "$0.99 for 1 week" — never hardcoded, always
// read from whatever intro offer is actually configured in RevenueCat.
export function describeIntroOffer(intro: PurchasesIntroPrice): string {
  const count = parseIsoPeriodCount(intro.period);
  const unit = periodUnitLabel(intro.periodUnit, count);
  if (intro.price === 0) {
    return `${count}-${unit.replace(/s$/, '')} free trial`;
  }
  return `${intro.priceString} for ${count} ${unit}`;
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
