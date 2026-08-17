# Widget & Live Activity — Setup Guide (not implemented)

This is documentation only. No code for this section is in the repo, for a
concrete reason: WidgetKit (iOS) and Android home-screen widgets are built
with native Swift/Kotlin UI toolkits that a Metro/JS session — the tooling
available while building the rest of this app — cannot compile, run, or
screenshot to verify. Shipping unverified native code here would mean
guessing at a build that might not even compile in Xcode/Android Studio.
Everything below is accurate as of Expo SDK 57 (2026), but should be
treated as a starting point, not copy-paste-ready code.

## Why this is a bigger step than everything else in this project

Every other integration in this app (RevenueCat, AdMob, notifications,
PostHog, Sentry, Supabase) is a JS/native-module SDK that autolinks through
Expo's prebuild — install the package, add a config plugin, done. Widgets
and Live Activities are different: they are a **second, separate app
target** (a Widget Extension on iOS, an AppWidgetProvider on Android) with
its own UI code, its own build step, and its own way of receiving data from
the main app. There's no way around opening Xcode / Android Studio at some
point.

## Part 1 — iOS: streak widget (WidgetKit)

**Goal:** a home-screen widget showing the current streak (`🔥 N`), refreshed
whenever the app updates it.

### Recommended path: `@bittingz/expo-widgets`

This community Expo config plugin scaffolds a WidgetKit extension and wires
up an App Group for data sharing, without leaving the Expo/EAS workflow
entirely.

1. `npx expo install @bittingz/expo-widgets`
2. Add the plugin to `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "@bittingz/expo-widgets",
           {
             "ios": {
               "src": "./ios-widget",
               "name": "DontTouchStreakWidget",
               "bundleIdentifier": "com.yourcompany.donttouch.streakwidget",
               "deploymentTarget": "16.0"
             }
           }
         ]
       ]
     }
   }
   ```
3. Create `./ios-widget/` containing a standard WidgetKit `Widget` +
   `TimelineProvider` in Swift (this part must be written and tested in
   Xcode — see Apple's [WidgetKit documentation](https://developer.apple.com/documentation/widgetkit)).
   A minimal `TimelineEntry` just needs `streak: Int` and `lastUpdated: Date`.
4. From the JS side, write the streak to the shared App Group container
   every time `stats.currentStreak` changes (in `AppDataContext`, after
   `deriveStats` runs) using the plugin's provided bridge (or
   `react-native-shared-group-preferences` as an alternative if you don't
   want the WidgetKit scaffolding — you'd still hand-write the widget UI).
5. Call `WidgetCenter.shared.reloadAllTimelines()` (native side, or via
   the plugin's exposed JS method if it has one) after writing new data so
   the widget refreshes without waiting for its next scheduled reload.
6. Build with `eas build --platform ios` (or a local `expo prebuild` +
   Xcode build) — widgets cannot be tested in Expo Go or a JS-only preview.

### If you don't want a third-party plugin

You can add the WidgetKit extension by hand: `expo prebuild`, open the
generated `ios/` project in Xcode, File → New → Target → Widget Extension,
then hand-write the config plugin (a `withXcodeProject` mod) that keeps the
extension's `Info.plist`/entitlements in sync on every prebuild. This is
more work but avoids depending on a community package's maintenance status.

## Part 2 — Android: streak home-screen widget

### Recommended path: `react-native-android-widget`

Actively maintained, lets you define the widget's layout in JSX (compiled
to Android `RemoteViews` under the hood) — no Kotlin required for a simple
text widget.

1. `npm install react-native-android-widget`
2. Follow its config plugin setup (adds the plugin to `app.json`, generates
   the `AppWidgetProvider` manifest entry via `expo prebuild`).
3. Define a widget component (JSX subset, per the library's docs) that
   renders `🔥 {streak}`.
4. Register a task handler (`registerWidgetTaskHandler`) that responds to
   `WIDGET_ADDED`/`WIDGET_UPDATE` events and reads the current streak from
   `AsyncStorage` (same storage this app already uses — no separate data
   channel needed on Android, unlike iOS's App Group requirement).
5. Call the library's update function after `deriveStats` changes, same
   trigger point as the iOS write in Part 1.
6. Build with `eas build --platform android` or a local
   `expo prebuild && expo run:android` — again, not testable in Expo Go.

## Part 3 — iOS: Live Activity for an active session

**Goal:** while a run is active, show elapsed time on the Lock Screen /
Dynamic Island (per the original product analysis: "watch but don't
touch" fits the Dynamic Island's ethos).

This is a heavier lift than the streak widget:

1. Requires iOS 16.1+ and a `NSSupportsLiveActivities` entitlement.
2. Needs an `ActivityAttributes` struct (Swift) defining the activity's
   static + dynamic content — for this app: `goalMs` (static),
   `elapsedMs`/`dangerLevel` (dynamic, updated periodically).
3. Started from Swift via `Activity.request(...)`, which means a native
   module bridge is required to trigger it from the JS `SessionScreen`
   when a run starts, and to end it in `SessionResultScreen`.
4. `expo-live-activity` (community package, check current maintenance
   status before adopting) wraps this bridge; otherwise it's a hand-written
   native module.
5. Updating a running Live Activity from JS on a ~1s cadence to show the
   ticking timer is possible but adds real battery/CPU cost — consider
   updating only on danger-level transitions (every few minutes) rather
   than every second, matching this app's existing `dangerLevels.ts` cadence.

### Recommendation

Given the added maintenance surface (a second native target, App Group
plumbing, Live Activity lifecycle bugs are a common source of iOS crash
reports), do the streak widget first and only pick up the Live Activity
if user demand or retention data specifically justifies it — it's the
highest-effort, most native-code-heavy piece in this entire roadmap.

## What would need to happen before any of this is safe to ship

- A macOS machine with Xcode (Live Activities and WidgetKit cannot be
  built or tested on Windows/Linux/CI-only setups).
- `expo prebuild` run locally at least once to generate `ios/`/`android/`
  native projects — this repo is currently Expo-managed with no native
  folders checked in (see `.gitignore`: `/ios`, `/android`).
- A real Apple Developer account (App Groups require one) and Android
  signing setup for the widget's AppWidgetProvider manifest entry.
- Manual testing on a physical device or simulator/emulator — widgets
  and Live Activities do not render in Expo Go.
