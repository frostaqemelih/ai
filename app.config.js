// Dynamic config (instead of app.json) so the AdMob plugin's App IDs can
// come from environment variables — unlike RevenueCat/Sentry/PostHog keys
// (read at JS runtime), the AdMob App ID is baked into the native
// Info.plist / AndroidManifest.xml at prebuild time, so it has to be
// resolved here rather than in a services/*.ts wrapper.
//
// Falls back to Google's own public TEST App IDs (documented at
// https://developers.google.com/admob/android/test-ads and
// https://developers.google.com/admob/ios/test-ads) so `expo prebuild` /
// `eas build` never fails just because real IDs haven't been set yet —
// every rewarded ad in that case still only ever serves Google's test
// creative, never a real one.
const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = {
  expo: {
    name: "Don't Touch",
    slug: 'dont-touch',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0A0A0B',
    ios: {
      supportsTablet: false,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0A0A0B',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-splash-screen',
      'expo-notifications',
      '@sentry/react-native',
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            "This lets us show you ads that are more relevant to you. Don't Touch never tracks anything else about you.",
        },
      ],
      'expo-localization',
      'expo-sharing',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_ADMOB_IOS_APP_ID,
        },
      ],
    ],
  },
};
