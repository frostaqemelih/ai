// Placeholder legal copy — replace with real, lawyer-reviewed text before
// submitting to the App Store / Play Store. Keep the same section shape
// (title + body) so LegalScreen.tsx doesn't need changes when you swap it.
export interface LegalSection {
  title: string;
  body: string;
}

export const PRIVACY_POLICY_UPDATED = 'Last updated: [DATE — fill in on real publish]';

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: 'What stays on your device',
    body: 'Your session history, streak, coins, achievements, and settings are stored only on this device (local storage). Don\'t Touch does not require an account and does not ask for your name, email, or phone number.',
  },
  {
    title: 'Anonymous usage data',
    body: 'We use PostHog to understand how the app is used (e.g. which goal lengths are popular, where people drop off) via a random identifier generated on your device — never your name, email, or device advertising ID unless you\'ve granted tracking permission for ad personalization.',
  },
  {
    title: 'Crash reports',
    body: 'We use Sentry to receive crash and error reports so we can fix bugs. These reports may include technical details (device model, OS version, a stack trace) but not your personal information.',
  },
  {
    title: 'Advertising',
    body: 'If you watch a rewarded ad (to double coins or save a streak), the ad is served by Google AdMob. On iOS, we ask for App Tracking Transparency permission before any ad personalization; declining still lets you watch ads, just without personalization.',
  },
  {
    title: 'Subscriptions',
    body: 'Premium purchases are processed by Apple/Google through RevenueCat. We receive your purchase and entitlement status, never your payment details.',
  },
  {
    title: 'Friend Duel (fully optional)',
    body: 'If you create or join a Friend Duel, your device generates a random ID and your run result is stored on our Supabase backend so your opponent can see it. This only happens if you open the Duel screen and use the feature — it is off by default.',
  },
  {
    title: 'Global stats (fully optional)',
    body: 'If you turn on "Contribute to global stats" in Settings, the duration of your completed runs is added to an anonymous, aggregate worldwide counter. No individual run or device can be identified from this counter.',
  },
  {
    title: 'Your choices',
    body: 'You can reset all local data at any time from Settings → Reset Progress. You can decline notification and tracking permissions at any time from your device settings.',
  },
  {
    title: 'Contact',
    body: '[Insert a real support email before publishing.]',
  },
];

export const TERMS_UPDATED = 'Last updated: [DATE — fill in on real publish]';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Using the app',
    body: "Don't Touch is a self-discipline game. It has no medical, therapeutic, or safety claims — it's entertainment and a personal productivity tool, not a substitute for professional advice about screen time or digital wellbeing.",
  },
  {
    title: 'Subscriptions',
    body: 'Premium is an auto-renewing subscription billed through your App Store or Play Store account. It renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel it from your device\'s subscription settings.',
  },
  {
    title: 'Virtual currency',
    body: "Coins earned or purchased in the app have no real-world monetary value, cannot be exchanged for cash, and are forfeited if you delete the app or reset your progress.",
  },
  {
    title: 'Friend Duel conduct',
    body: 'Friend Duel is meant for consenting participants you know. Don\'t use it to harass or spam other people with invite codes.',
  },
  {
    title: 'No warranty',
    body: 'The app is provided "as is." We work to keep session timing and streak calculations accurate but cannot guarantee the app is free of bugs.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms as the app evolves. Continued use after an update means you accept the revised terms.',
  },
  {
    title: 'Contact',
    body: '[Insert a real support email before publishing.]',
  },
];
