import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOffering,
  type PurchasesPackage,
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

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; info: CustomerInfo | null }> {
  if (!isNativePlatform() || !configured) return { success: false, info: null };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, info: customerInfo };
  } catch (err: any) {
    if (err?.userCancelled) return { success: false, info: null };
    console.warn('[purchasesService] purchase failed', err);
    return { success: false, info: null };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; info: CustomerInfo | null }> {
  if (!isNativePlatform() || !configured) return { success: false, info: null };
  try {
    const info = await Purchases.restorePurchases();
    return { success: true, info };
  } catch (err) {
    console.warn('[purchasesService] restore failed', err);
    return { success: false, info: null };
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
