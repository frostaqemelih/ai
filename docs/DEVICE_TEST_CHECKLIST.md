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

## Faz 12 — Coin purchase reconciliation & edge cases

**Web-invisible, all of it.** `reconcileCoinPurchases()` (the single
function that credits coins for a store purchase — see
`AppDataContext.tsx`) and the outcome-classification in
`purchasesService.ts` have never run against a real store. Every item
below needs a real RevenueCat **sandbox** setup: a Google Play Console
license tester account (Android) or an App Store Connect sandbox tester
(iOS), with the `coins` offering configured in RevenueCat pointing at real
sandbox products.

- [ ] **Baseline credit.** Buy `coins_small` once. Confirm the balance
      increases by exactly that pack's coin amount, and that
      `@dt/creditedTransactionIds` in AsyncStorage now contains that
      transaction's identifier (inspect via a debug menu or React Native
      DevTools — there's no in-app viewer for this key).
- [ ] **Idempotency — the core guarantee.** Immediately after the purchase
      above completes, force-kill the app and relaunch it. Confirm the
      balance does **not** increase again on relaunch (the boot-time
      `reconcileCoinPurchases()` call must see the transaction is already
      in the credited set and skip it).
- [ ] **Crash before reconciliation.** This is the scenario the whole
      design exists for. Buy a coin pack, and the instant the store's own
      "purchase successful" confirmation appears (before the app's own
      success UI has a chance to run), force-kill the app from the OS app
      switcher. Relaunch. Confirm the coins are credited on this next
      launch — this proves reconciliation, not the purchase-flow success
      handler, is what actually grants coins.
- [ ] **PENDING purchase.** Google Play sandbox: use a test payment method
      that produces a pending/delayed state (Play Console → license
      testers → test card options include a "slow" or deferred card in
      some regions; check current Play Console docs, this changes). Start
      a coin purchase with it. Confirm: no coins appear immediately, the
      persona-toned "still processing" message shows (not a raw error),
      and once the payment actually clears (may take a few minutes),
      reopening the app credits the coins without you doing anything else.
- [ ] **ITEM_ALREADY_OWNED / stuck pending from a prior session.** Trigger
      a pending purchase (as above) or otherwise leave an unconsumed
      purchase in the store's queue, then try to buy the *same* pack again
      before it resolves. Confirm no raw error dialog appears — the app
      should show the same "processing" message and quietly trigger
      reconciliation instead.
- [ ] **User cancels.** Start any coin purchase, then dismiss the native
      store payment sheet (back button / swipe down / X). Confirm the app
      shows **no message at all** — not even a toast — and the purchasing
      state clears so the buttons are tappable again immediately.
- [ ] **Network error.** Enable Airplane Mode after tapping a coin pack but
      before the store sheet finishes loading (or mid-purchase if your
      test device allows toggling connectivity that precisely). Confirm
      the app shows the "couldn't reach the store, you weren't charged"
      message, not a generic error and not silence.
- [ ] **Quantity (best-effort, may not be triggerable at all).** This
      app's own UI never lets a user request more than 1 unit of a coin
      pack — `Purchases.purchasePackage()` has no quantity parameter in
      this RevenueCat SDK version. The only way this could matter is if
      Google Play's own store surface (outside this app) allowed a
      multi-quantity purchase of one of these SKUs, which requires
      specific Play Console product configuration. If you can construct
      that scenario, confirm the credited amount is `pack coins × quantity`
      by checking `transactionQuantity()`'s best-effort parse of the raw
      Android purchase receipt (`originalJson`) in `purchasesService.ts`.
      If you can't construct it, this item can't be verified and should
      stay unchecked with a note why, rather than being marked done.
- [ ] **Restore Purchases does not grant coins.** After confirming Premium
      correctly restores (existing Monetization section above), on the
      same device tap "Restore Purchases" again and confirm the coin
      balance is completely unaffected — coins are consumable and
      intentionally excluded from the restore flow (see the disclosure
      copy in StoreScreen and the note under the restore button in
      PaywallScreen).
- [ ] **Reinstall wipes coins (confirms the disclosure is accurate).** Note
      the coin balance, uninstall the app, reinstall it, sign back into
      the same sandbox account if applicable. Confirm the coin balance is
      **0**, not restored — this is the exact behavior StoreScreen and
      Terms warn the user about; if it doesn't hold, the disclosure copy is
      lying and either the copy or `resetAllData`'s ledger-preservation
      logic needs to change.

## What's already been verified (and by what)

To be clear about the boundary: `tsc --noEmit` passing and the web preview
not crashing only prove the JS compiles and the fail-safe fallbacks work
when a native module is entirely absent (Expo Go / web). They prove nothing
about whether a real ad loads, a real purchase completes, a real
notification fires, or a real haptic is felt. Every item above needs an
actual checkmark from an actual device — don't mark this checklist "done"
from a code review.
