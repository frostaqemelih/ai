import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesStoreTransaction,
} from 'react-native-purchases';

// Must match the entitlement identifier configured in the RevenueCat
// dashboard (Entitlements tab). "premium" is the expected name — rename
// here if the dashboard uses something else.
export const PREMIUM_ENTITLEMENT_ID = 'premium';

let configured = false;

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function isEntitled(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
}

export async function configurePurchases(): Promise<void> {
  if (!isNativePlatform() || configured) return;
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn(
      '[purchasesService] No RevenueCat API key set (EXPO_PUBLIC_REVENUECAT_*_KEY) — premium purchases are disabled.'
    );
    return;
  }

  try {
    Purchases.configure({ apiKey });
    configured = true;
  } catch (err) {
    console.warn('[purchasesService] configure() failed', err);
  }
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  if (!isNativePlatform() || !configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (!isNativePlatform() || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

// For offerings other than the default "current" one — e.g. a dedicated
// "coins" offering holding the consumable coin-pack products, configured
// separately in the RevenueCat dashboard.
export async function fetchOfferingByIdentifier(id: string): Promise<PurchasesOffering | null> {
  if (!isNativePlatform() || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[id] ?? null;
  } catch {
    return null;
  }
}

// Purchase-flow outcomes a UI actually needs to react to differently.
// Deliberately coarser than PURCHASES_ERROR_CODE's ~35 values — every code
// not called out explicitly below collapses to 'unknown' (a generic,
// non-alarming failure message), so a future SDK error code that isn't
// mapped here degrades safely instead of falling through unhandled.
export type PurchaseOutcome = 'cancelled' | 'pending' | 'alreadyOwned' | 'network' | 'unknown';

// Classifies by the SDK's typed PURCHASES_ERROR_CODE enum, never by string
// matching error messages (messages aren't a stable API and can change
// between SDK versions/locales).
function classifyPurchaseError(code: PURCHASES_ERROR_CODE | undefined): PurchaseOutcome {
  switch (code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return 'cancelled';
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'pending';
    // RevenueCat/Google Play can also surface a stuck-pending purchase from
    // a *previous* session as "already purchased" rather than "pending" —
    // both cases mean the same thing to the user (no product yet, nothing
    // to alarm them about) and both should trigger reconciliation rather
    // than a raw error.
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return 'alreadyOwned';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'network';
    default:
      return 'unknown';
  }
}

export interface PurchaseResult {
  success: boolean;
  info: CustomerInfo | null;
  /** Present only when `success` is false — see PurchaseOutcome. */
  outcome?: PurchaseOutcome;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!isNativePlatform() || !configured) return { success: false, info: null, outcome: 'unknown' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, info: customerInfo };
  } catch (err: any) {
    const outcome = classifyPurchaseError(err?.code);
    if (outcome === 'unknown') {
      console.warn('[purchasesService] purchase failed', err);
    }
    return { success: false, info: null, outcome };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isNativePlatform() || !configured) return { success: false, info: null, outcome: 'unknown' };
  try {
    const info = await Purchases.restorePurchases();
    return { success: true, info };
  } catch (err: any) {
    const outcome = classifyPurchaseError(err?.code);
    if (outcome === 'unknown') {
      console.warn('[purchasesService] restore failed', err);
    }
    return { success: false, info: null, outcome };
  }
}

// Every non-subscription (consumable) transaction RevenueCat has on record
// for this user — the source of truth for coin-purchase reconciliation
// (AppDataContext.reconcileCoinPurchases). RevenueCat only resolves
// purchasePackage()/adds a transaction here once the store has genuinely
// finalized it as purchased, so a PENDING transaction never appears —
// nothing extra to filter out here for that case.
export async function getNonSubscriptionTransactions(): Promise<PurchasesStoreTransaction[]> {
  const info = await getCustomerInfoSafe();
  return info?.nonSubscriptionTransactions ?? [];
}

// Google Play supports multi-quantity purchases of a single one-time
// product; the purchased quantity is not exposed as a typed field on
// PurchasesStoreTransaction anywhere in this SDK version, only inside the
// raw Android purchase receipt JSON (`originalJson`, null on iOS and most
// other stores). This is a best-effort read of that undocumented shape —
// defaults to 1 (the overwhelmingly common case, and this app's own
// purchase flow never requests more than 1) if the field is absent,
// unparseable, or the platform doesn't provide originalJson at all.
export function transactionQuantity(tx: PurchasesStoreTransaction): number {
  if (!tx.originalJson) return 1;
  try {
    const parsed = JSON.parse(tx.originalJson) as { quantity?: unknown };
    const quantity = Number(parsed.quantity);
    return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  } catch {
    return 1;
  }
}

export function addCustomerInfoListener(listener: CustomerInfoUpdateListener): void {
  if (!isNativePlatform()) return;
  Purchases.addCustomerInfoUpdateListener(listener);
}

export function removeCustomerInfoListener(listener: CustomerInfoUpdateListener): void {
  if (!isNativePlatform()) return;
  Purchases.removeCustomerInfoUpdateListener(listener);
}
