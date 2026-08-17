# Don't Touch

A minimalist, gamified digital-detox app: put your phone down, don't touch
the screen, and see how long you last. Built with Expo SDK 57 / React
Native 0.86 / TypeScript.

## Running locally

```bash
npx expo start --web    # quickest way to see UI changes
npx expo start          # then scan the QR code with Expo Go
```

As of this build, most of the app (core gameplay, coins, Store, Settings,
Stats, Achievements, RevenueCat in "Browser Mode" fallback, local
notifications, PostHog, Sentry, Supabase Duel) still runs in plain Expo Go.
**RevenueCat's native purchase flow and real AdMob ads require a custom
dev client / EAS build** — see the manual steps below.

## Manual steps required before shipping

None of the third-party services below have real credentials in this repo
(by design — see `.env.example`). Each needs an account and a config step
on your side before the corresponding feature works for real. Nothing
breaks if you skip a step: every integration fails safe (silently disables
itself, logs a warning) when its key is missing.

1. **RevenueCat** (`src/services/purchasesService.ts`)
   - Create a project at [app.revenuecat.com](https://app.revenuecat.com).
   - Add your App Store / Play Store apps, create a `premium` **entitlement**
     (must match `PREMIUM_ENTITLEMENT_ID` in `purchasesService.ts` — rename
     one side if you use a different name).
   - Create an **Offering** with `monthly` and `annual` **Packages** (the
     Paywall screen reads `offering.monthly` / `offering.annual` directly).
   - Copy the iOS and Android public SDK keys into `.env` as
     `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
   - In App Store Connect / Play Console, create the actual subscription
     products (monthly ~$4.99, annual ~$24.99 per the original brief) and
     link them to the RevenueCat packages.
   - **This requires moving off plain Expo Go** — run `npx expo prebuild`
     and build with EAS (`eas build`) or a local custom dev client, since
     `react-native-purchases` ships native code.

2. **AdMob** (`src/services/adsService.ts` — currently a simulated
   placeholder, not yet wired to a real SDK)
   - Create an AdMob app at [admob.google.com](https://admob.google.com),
     get your App IDs and ad unit IDs (rewarded + interstitial).
   - Fill in `.env`: `EXPO_PUBLIC_ADMOB_IOS_APP_ID`,
     `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, and the four unit-ID variables.
   - Install `react-native-google-mobile-ads` and replace the simulated
     logic in `adsService.ts` and `RewardedAdModal.tsx` — the function
     signatures were kept provider-agnostic on purpose so this is a
     contained swap. This also requires the EAS/dev-client build from
     step 1 (same native-code constraint).

3. **PostHog** (`src/services/analyticsService.ts`)
   - Create a project at [posthog.com](https://posthog.com) (or self-host).
   - Copy the project API key into `.env` as `EXPO_PUBLIC_POSTHOG_API_KEY`
     (and `EXPO_PUBLIC_POSTHOG_HOST` if self-hosting or using the EU cloud).

4. **Sentry** (`src/services/crashService.ts`)
   - Create a project at [sentry.io](https://sentry.io).
   - Copy the DSN into `.env` as `EXPO_PUBLIC_SENTRY_DSN`.
   - For source-map upload during EAS builds, also set `SENTRY_ORG` and
     `SENTRY_PROJECT` (see the `@sentry/react-native/expo` config plugin
     docs) — without these, crashes still report but stack traces won't be
     symbolicated.

5. **Supabase** (Friend Duel + Global Stats — both fully optional features,
   `src/services/duelService.ts` / `globalStatsService.ts` / `supabaseClient.ts`)
   - Create a project at [supabase.com](https://supabase.com).
   - Run **both** `supabase/migrations/0001_duels.sql` and
     `supabase/migrations/0002_global_stats.sql` in the SQL editor (or via
     `supabase db push`) — the first creates `duels`/`duel_participants`,
     the second creates `daily_aggregate_stats` and its
     `increment_global_stats()` RPC.
   - Copy the project URL and anon key into `.env` as
     `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
   - No user accounts are created — each device generates its own random
     UUID locally (Duel only; Global Stats sends no identifier at all). If
     left unconfigured, the Duel screen shows a plain "not set up yet"
     message and Stats shows "Coming soon" instead of crashing.

6. **Apple / Google subscription groups** — set up the actual monthly and
   annual subscription products in App Store Connect and Google Play
   Console (referenced in step 1), including localized pricing and any
   required subscription-group configuration for upgrade/downgrade
   proration.

7. **Widget / Live Activity** — not implemented; see
   `docs/WIDGET_AND_LIVE_ACTIVITY_GUIDE.md` for the concrete setup path
   once you're ready to open Xcode/Android Studio.

8. **App Tracking Transparency (iOS)** (`src/services/trackingService.ts`)
   - Already wired: the app prompts for ATT right after onboarding
     (`OnboardingScreen.tsx`), and `app.json`'s
     `expo-tracking-transparency` plugin config sets the
     `NSUserTrackingUsageDescription` string. Nothing further is required
     unless you want to customize that message.
   - Note this only matters once real AdMob (step 2) is wired — the
     current PostHog integration uses a random on-device ID, not IDFA, and
     does not require ATT under Apple's guidelines.

9. **Privacy Policy & Terms of Service** (`src/utils/legalContent.ts`)
   - The in-app Privacy Policy and Terms screens currently show
     **placeholder text** (clearly marked `[DATE — fill in on real
     publish]` / `[Insert a real support email]`). Replace the content in
     `legalContent.ts` with real, lawyer-reviewed text before submitting
     to the App Store / Play Store — both require a reachable privacy
     policy URL, and RevenueCat/AdMob dashboards ask for one too.
   - If you also need a public, non-app URL (App Store Connect asks for
     one separately from the in-app screen), host the same content
     wherever you host your marketing site and link both to the same text.

10. **App Store / Play Store privacy label declarations** — reference
    table for filling out App Store Connect's "App Privacy" (Privacy
    Nutrition Label) form and Play Console's "Data safety" form. This is a
    form-filling step on your end, not something the code can automate.

    | Third party | Data category | Linked to identity? | Used for |
    |---|---|---|---|
    | RevenueCat | Purchase history | No (RevenueCat-generated anonymous app user ID) | Subscription entitlement management |
    | AdMob (once wired) | Advertising data (IDFA on iOS, if ATT granted) | Only if user grants ATT | Ad personalization / delivery |
    | PostHog | Product interaction (anonymous) | No (random on-device UUID, not IDFA) | Analytics |
    | Sentry | Crash data (device model, OS version, stack traces) | No | Crash/error diagnostics |
    | Supabase (Friend Duel, opt-in) | Session duration + random device ID | No (no name/email) | Only if the user opens Duel and creates/joins one |
    | Supabase (Global stats, opt-in) | Session duration only | No | Only if the user enables "Contribute to global stats" |

    Net summary for the "Data Not Collected" question: **no**, once
    PostHog/Sentry/AdMob are live you can no longer claim zero data
    collection — but you can accurately claim **no data linked to
    identity**, since nothing here collects a name, email, or persistent
    cross-app identifier without explicit ATT consent.

11. **RevenueCat intro/trial offer** (`src/utils/paywall.ts`,
    `PaywallScreen.tsx`)
    - The Paywall automatically displays whatever intro offer (free trial or
      discounted intro price) is configured on a package's `introPrice` —
      but nothing is configured by default. If you want a "3 days free,
      then $4.99/mo" style offer, set it up as an **Introductory Offer** on
      the underlying App Store Connect / Play Console subscription product
      (RevenueCat surfaces whatever the store returns; it doesn't let you
      define trial length independently of the store's own offer config).
    - The "BEST VALUE · SAVE X%" badge on the annual package is computed
      automatically from `offering.monthly` and `offering.annual` prices —
      no action needed there once both packages exist.

12. **App Store / Play Store URLs for the rating prompt fallback**
    (`src/services/ratingService.ts` via `expo-store-review`)
    - On iOS 10.3+ and Android 5+, `requestReview()` uses the OS's native
      in-app rating sheet — no config needed.
    - As a fallback on older Android versions, `expo-store-review` links out
      to the store listing using `app.json`'s `ios.appStoreUrl` and
      `android.playStoreUrl` — set these once the app has real store
      listings, otherwise the fallback link silently does nothing (already
      wrapped in `ratingService.ts`'s try/catch).

13. **Remaining screens still in English only** (see the localization
    commit for the full list) — `src/screens/`: StatsScreen, Achievements,
    SettingsScreen (own labels), StoreScreen, DuelScreen, GoalSelectScreen,
    and `LegalScreen`'s Privacy/Terms body copy. Also untranslated:
    `dangerLevels.ts` labels (SAFE/FOCUS/…), `temptations.ts` and
    `milestones.ts` in-session messages, and `achievementDefs.ts`
    titles/descriptions — these live in data files rather than screens, so
    migrating them means restructuring those files to hold both locales,
    not just wrapping JSX in `t()`.

14. **Store listing materials** (screenshots, app description, keyword
    list, promo video/GIF) — not code, not in this repo. Ask separately
    when you're ready to prepare the actual App Store / Play Store listing.

## Environment variables

Copy `.env.example` to `.env` and fill in the keys you need (see above).
`.env` is gitignored — never commit real keys.

## Project structure

- `src/context/AppDataContext.tsx` — single source of truth for all app
  state (settings, sessions, coins, premium status, etc.)
- `src/storage/storage.ts` — the only place that touches AsyncStorage
  directly; everything else goes through `AppDataContext`
- `src/services/` — third-party SDK wrappers (ads, purchases,
  notifications, analytics, crash reporting, Supabase/duel) — each fails
  safe if unconfigured
- `src/screens/` — one file per screen, wired together in
  `src/navigation/RootNavigator.tsx`
