import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// Real ad unit IDs come from .env; falls back to Google's own public TEST
// unit ID (per-platform, resolved by the SDK itself) so a run with no real
// ID configured yet always serves a harmless test creative instead of
// failing to load or — worse — accidentally hitting a real ad slot.
function rewardedAdUnitId(): string {
  const real =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID
      : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID;
  return real || TestIds.REWARDED;
}

let initPromise: Promise<boolean> | null = null;
function ensureInitialized(): Promise<boolean> {
  if (!initPromise) {
    initPromise = mobileAds()
      .initialize()
      .then(() => true)
      .catch(() => false);
  }
  return initPromise;
}

// Set from AppDataContext whenever ATT status changes — defaults to true
// (non-personalized) until the user explicitly grants tracking, which is
// the conservative/compliant default for the gap before that decision.
let nonPersonalizedOnly = true;
export function setNonPersonalizedAdsOnly(value: boolean): void {
  nonPersonalizedOnly = value;
}

// Loads and shows one rewarded ad, resolving true only if the user actually
// earned the reward (i.e. watched to completion) — closing early, a load
// failure, or any SDK error all resolve false and never grant a reward.
export async function showRewardedAd(): Promise<boolean> {
  const ready = await ensureInitialized();
  if (!ready) return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let earned = false;

    const rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId(), {
      requestNonPersonalizedAdsOnly: nonPersonalizedOnly,
    });

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      unsubLoaded();
      unsubEarned();
      unsubError();
      unsubClosed();
      resolve(result);
    };

    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      try {
        rewarded.show();
      } catch {
        finish(false);
      }
    });
    const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => finish(false));
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => finish(earned));

    try {
      rewarded.load();
    } catch {
      finish(false);
    }
  });
}
