// Web build: react-native-google-mobile-ads is a native-only SDK with no
// web shim at all (unlike react-native-view-shot, it doesn't even ship a
// broken one) — Metro would fail to resolve it if adsService.ts were
// bundled for web, so this file exists purely so the platform-specific
// resolution never touches the real package on web at all.
export function setNonPersonalizedAdsOnly(_value: boolean): void {}

export async function showRewardedAd(): Promise<boolean> {
  return false;
}
