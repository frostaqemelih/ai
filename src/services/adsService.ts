// Placeholder rewarded-video provider. This gives the reward economy (coin
// doubling, streak insurance) a real, working seam without requiring live ad
// network credentials. Swap the implementation for a real SDK — e.g.
// react-native-google-mobile-ads' RewardedAd.createForAdRequest(...) — before
// shipping. Nothing outside this file needs to change: callers only care
// about the resolved boolean.
const SIMULATED_AD_DURATION_MS = 2600;

export function getSimulatedAdDurationMs(): number {
  return SIMULATED_AD_DURATION_MS;
}

export function isRewardedAdAvailable(): boolean {
  return true;
}
