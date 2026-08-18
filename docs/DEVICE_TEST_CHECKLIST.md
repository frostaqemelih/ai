# Device Test Checklist

Everything on this list has to be checked on a **real physical device**
running a `development` or `preview` build (see the "Building for a real
device" section in the [README](../README.md)). None of it can be verified
by `tsc`, ESLint, or the web preview — that's the whole point of this
document. Where a web preview genuinely can't reveal a bug at all (not just
"looks different"), it's called out explicitly under **Web-invisible**.

Check items off as you go. If something fails, file it before moving on —
don't just remember it.

## Core mechanic (highest priority — this is the app's entire premise)

These all follow directly from Faz 8's Bulgu 1 (the keep-awake fix) and the
`AppState`/background-detection logic in `SessionScreen.tsx`.

- [ ] **Web-invisible.** Start a session with "Keep screen awake" ON, put
      the phone down, and don't touch it until your device's normal
      auto-lock timeout would have fired (check Settings > Display &
      Brightness > Auto-Lock, usually 30s–2min). The screen should **stay
      on** and the session should **not** fail.
- [ ] **Web-invisible.** Repeat with "Keep screen awake" OFF. The screen
      should lock on its own, and the session **should** fail as
      "backgrounded" — confirm the Settings warning text was accurate.
- [ ] Start a full 1-hour session and let it run to completion untouched.
      (Combine with the point above — this is the actual real-world
      scenario Bulgu 1 was about.)
- [ ] **Web-invisible.** Receive a phone call during a session. Decide
      whether "call backgrounds the app → session fails" is the behavior
      you want, or whether it should be forgiven — this is a product
      decision, not a bug, but it needs a deliberate answer.
- [ ] **Web-invisible.** Trigger a notification banner (send yourself one,
      or wait for a normal one) while a session is running. iOS treats an
      incoming banner as `inactive`, not `background` — confirm the session
      **keeps running** (this is already correct in the code; this step
      verifies the assumption, not the code).
- [ ] **Web-invisible.** Pull down Control Center / Notification Center
      mid-session. Same `inactive`-not-`background` expectation — session
      should keep running.
- [ ] **Web-invisible.** Force-quit the app mid-session (swipe away from
      the app switcher), then reopen it. The interrupted run should appear
      in history as `failReason: 'interrupted'`, not be silently lost.
- [ ] An alarm or timer fires while a session is running — confirm the
      expected behavior (likely `inactive`, session continues; verify it
      actually does).

## Monetization (100% of revenue depends on this group)

- [ ] RevenueCat **sandbox** account: buy the monthly subscription, confirm
      `isPremium` flips true and ads/limits disappear immediately.
- [ ] Buy the annual package. Buy the lifetime package. Confirm both grant
      the same `premium` entitlement.
- [ ] Buy each coin consumable pack (`coins_small`/`medium`/`large`),
      confirm the balance increases by the right amount every time —
      including buying the same pack twice in a row.
- [ ] Tap "Restore Purchases" on a device with no active RevenueCat
      session; confirm it correctly finds nothing. Then restore on a device
      that previously purchased; confirm it correctly restores.
- [ ] After buying Premium, confirm **zero** AdMob calls happen anywhere in
      the app for the rest of the session (SessionResultScreen already
      gates every ad trigger behind `!isPremium` — this step verifies that
      gate holds on a real ad SDK, not just in the UI).
- [ ] **Web-invisible.** Watch a rewarded ad end-to-end using AdMob's
      `TestIds.REWARDED` creative (the default fallback when no real unit
      ID is set): confirm it loads, plays, and the reward (streak save or
      coin double) is actually granted after it closes.
- [ ] **Web-invisible.** Start a rewarded ad and close it **before** it
      finishes. Confirm no reward is granted — this is the single most
      important ad-related check, since a bug here directly costs money.
- [ ] **Web-invisible.** Deny the App Tracking Transparency prompt, then
      watch a rewarded ad. There's no direct on-screen confirmation of
      "non-personalized" mode, but confirm the ad still loads and plays
      normally (i.e. the `requestNonPersonalizedAdsOnly` path doesn't
      silently break ad loading).

## Retention features

- [ ] **Web-invisible.** Enable Reminders, then set your device clock
      forward past the scheduled streak-reminder time (20:00 local) or the
      3-day inactivity threshold — confirm the notification actually
      arrives, with the expected title/body.
- [ ] **Web-invisible.** Confirm the ATT permission dialog appears at the
      expected point (right after onboarding) and only once per install.
- [ ] **Web-invisible.** From a completed session, tap "Share Result" and
      confirm it produces an actual PNG image (not the text-only fallback)
      and opens the native share sheet.
- [ ] **Web-invisible.** Trigger `expo-store-review`'s prompt (new record
      or newly unlocked achievement, subject to its 60-day cooldown —
      you may need to reset `lastRatingPromptAt` in storage to force it)
      and confirm the native rating dialog appears.
- [ ] **Web-invisible.** Feel each haptic intensity (light/medium/heavy) as
      the danger level escalates during a session — confirm they're
      distinguishable, not just "some vibration happened."
- [ ] Reach a streak of 7 (or seed sessions to get there faster) and
      confirm the milestone celebration overlay + coin bonus fire exactly
      once, not on every session afterward.
- [ ] Buy a Streak Freeze from the Store, then deliberately fail a session
      after a streak was active — confirm the freeze is auto-consumed
      (inventory count drops by 1) and the streak survives, without any ad
      or coin prompt appearing.

## Infrastructure

- [ ] **Web-invisible.** Deliberately throw an error somewhere (or use
      Sentry's own test-crash helper) and confirm it appears in the Sentry
      dashboard within a minute or two.
- [ ] Perform a few normal actions (start a session, open the Store) and
      confirm matching events show up in the PostHog dashboard.
- [ ] **Web-invisible — needs two physical devices.** Create a Friend Duel
      on device A, join it on device B, complete a run on both, and
      confirm each device correctly shows the other's result.
- [ ] **Web-invisible — needs two physical devices.** Same as above for
      Friend Streak: link two devices, have both complete a run on the
      same day, confirm the streak counter increments; skip a day on
      either device and confirm it resets to 0 on the next check.

## What's already been verified (and by what)

To be clear about the boundary: `tsc --noEmit` passing and the web preview
not crashing only prove the JS compiles and the fail-safe fallbacks work
when a native module is entirely absent (Expo Go / web). They prove nothing
about whether a real ad loads, a real purchase completes, a real
notification fires, or a real haptic is felt. Every item above needs an
actual checkmark from an actual device — don't mark this checklist "done"
from a code review.
