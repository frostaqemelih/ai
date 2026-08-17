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

5. **Supabase** (Friend Duel — fully optional feature, `src/services/
   duelService.ts` / `supabaseClient.ts`)
   - Create a project at [supabase.com](https://supabase.com).
   - Run `supabase/migrations/0001_duels.sql` in the SQL editor (or via
     `supabase db push`) to create the `duels` / `duel_participants` tables
     and their RLS policies.
   - Copy the project URL and anon key into `.env` as
     `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
   - No user accounts are created — each device generates its own random
     UUID locally. If left unconfigured, the Duel screen shows a plain
     "not set up yet" message instead of crashing.

6. **Apple / Google subscription groups** — set up the actual monthly and
   annual subscription products in App Store Connect and Google Play
   Console (referenced in step 1), including localized pricing and any
   required subscription-group configuration for upgrade/downgrade
   proration.

7. **Widget / Live Activity** — not implemented; see
   `docs/WIDGET_AND_LIVE_ACTIVITY_GUIDE.md` for the concrete setup path
   once you're ready to open Xcode/Android Studio.

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
