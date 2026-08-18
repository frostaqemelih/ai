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
    // Placeholder — a bundle identifier is a ONE-TIME, irreversible choice
    // (App Store Connect and Play Console both lock it in forever on first
    // upload). "com.melihturan.donttouch" is a suggestion only; confirm or
    // change it here before the very first `eas build`, see README.
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.melihturan.donttouch',
      buildNumber: '1',
      infoPlist: {
        // Avoids an App Store Connect "export compliance" prompt on every
        // submission — the app uses only standard HTTPS/TLS, no custom
        // encryption. expo-notifications and expo-tracking-transparency
        // already inject their own required Info.plist entries via their
        // config plugins (notification icon, NSUserTrackingUsageDescription
        // above) — nothing else needs a manual entry here. This app has no
        // genuine background-execution need (keep-awake only runs while
        // foregrounded), so no UIBackgroundModes are declared.
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.melihturan.donttouch',
      versionCode: 1,
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
