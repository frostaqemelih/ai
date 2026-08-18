# Screenshot Spec (App Store / Google Play)

The [screenshot concepts artifact](https://claude.ai/code/artifact/024a49c5-1274-4149-adcc-a86b899c998c)
is a **design spec, not a deliverable** — its HTML redraws the app's UI,
which does not satisfy Apple 2.3.3 (frame/text overlays on top of a real
screen capture are fine; a redrawn interface is not, even if pixel-identical,
and any actual deviation from the real UI would additionally read as
misleading metadata). Every screenshot that ships must start from an actual
capture on a real device running a `development` or `preview` build (see
README → "Building for a real device"). This document is what to reproduce
from that capture — headline, order, and the exact in-app state each shot
needs — plus the export sizes both stores require.

## Known deviation from the concept artifact

The artifact's screenshot #1 used a red ring for the `UNTOUCHABLE` danger
level for visual drama. **The real color is violet** —
`dangerColors.untouchable` (`#C084FC`) in `src/theme/index.ts`, matched by
`DANGER_LEVELS` in `src/utils/dangerLevels.ts`. The real capture will show
violet; use it as-is rather than trying to match the concept's red.

## Required export sizes

**App Store** (screenshots go in App Store Connect → your app → App
Store version → App Previews and Screenshots):
- **6.9" class — 1320 × 2868 — the only required set.**
- 6.5" class — 1284 × 2778 — optional, but adding it improves render
  quality on devices that fall into that bucket instead of upscaling.
- Max 10 images per size class.

**Google Play** (Play Console → Grow → Store presence → Main store listing):
- 2–8 phone screenshots, 1080 × 1920 is sufficient.
- **Feature graphic — 1024 × 500 — required.** This is the banner shown at
  the top of the listing and in some search placements; it's easy to
  forget and the listing cannot go live without it. Not one of the 7
  screenshots below — a separate, single wide image (e.g. wordmark +
  tagline on the app's dark background, no phone frame needed).

## The 7 screenshots

Same order as the concept artifact — App Store/Play both show the first
2–3 before a "see more" tap, so slot order is a real ranking decision, not
just a list.

| # | Screen | Headline | State needed |
| - | ------ | -------- | ------------- |
| 1 | Session, `UNTOUCHABLE` danger level | How long can you last? | Elapsed ≥ 60:00 in an active run (real color: violet ring, not the concept's red — see above) |
| 2 | Home | A streak you won't want to break | `currentStreak` ≥ ~30 days, a healthy coin balance |
| 3 | Session, temptation overlay visible | It will try to break you | Any run ≥ 90s elapsed (temptations need `goalMs ≥ 90_000`, see `useSessionEvents.ts`) — no long wait required |
| 4 | Session Result, completed + new record | Beat your own record | A completed run where `isNewRecord` is true (confetti + `PERSONAL BEST` badge) |
| 5 | Friend Duel result | Challenge a friend | Two real devices, both submitted a result, one ahead of the other |
| 6 | Stats | See where your time goes | A few days of real/seeded session history so the weekly chart isn't empty |
| 7 | Settings, "No account" section | No account. No permissions. | Default state — nothing to set up, this one's free |

## Reaching each state on a real device

**Screens 4, 5, 6, 7** are either the natural result of normal use or need
no special setup — just play the app / complete a duel with a second
device / open Settings.

**Screen 3** (temptation) needs no waiting either — pick any goal ≥ 90
seconds and a temptation message will appear within roughly the first
minute (`firstTemptationDelay()` in `src/utils/temptations.ts`).

**Screens 1 and 2** are the two that need real elapsed time or seeded
history, covered below.

### Screen 1 — reaching UNTOUCHABLE (60+ real minutes elapsed)

Danger level is computed from **absolute elapsed time**, not percent of
goal (`getDangerLevel()` in `dangerLevels.ts`) — a short goal doesn't
shortcut this. The efficient approach: **start one long run (goal ≥ 60
min) and capture every danger tier along the way in the same sitting**,
instead of separately waiting for each one:

- ~5:00 elapsed → `FOCUS` (blue)
- ~10:00 → `DANGER` (amber)
- ~20:00 → `EXTREME` (orange-red)
- ~30:00 → `INSANE` (red)
- ~60:00 → `UNTOUCHABLE` (violet) — the one this spec calls for

The iOS/Android screenshot capture gesture does not background the app, so
grabbing a shot mid-run is safe and won't fail the session.

### Screen 2 — a 30+ day streak (seeded, temporary, dev-only)

Actually running the app daily for a month just to get a screenshot isn't
practical — seed fake session history into `AsyncStorage` instead, capture,
then remove the seed. This is standard practice as long as the screenshot
itself shows the real, unmodified app UI rendering that data (nothing about
the interface is altered — only its input data is).

Add a **temporary** debug affordance (e.g. a long-press on the version
number in `SettingsScreen.tsx`), call this once, capture the Home screen,
then delete the button and this file's import — don't ship it:

```ts
// TEMPORARY — screenshot seeding only. Delete before committing.
import AsyncStorage from '@react-native-async-storage/async-storage';

async function seedScreenshotStreak() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sessions = [];
  for (let i = 34; i >= 1; i--) {
    const endedAt = now - i * oneDay;
    sessions.push({
      id: `seed-${i}`,
      startedAt: endedAt - 15 * 60 * 1000,
      endedAt,
      goalMs: 15 * 60 * 1000,
      durationMs: 15 * 60 * 1000,
      completed: true,
    });
  }
  await AsyncStorage.setItem('@dt/sessions', JSON.stringify(sessions));
  await AsyncStorage.setItem('@dt/coins', '402');
}
```

This mirrors exactly how the streak/danger-level flows were smoke-tested
during Faz 7/8 development (via the browser preview's `localStorage`, which
is the web shim for the same `@dt/*` keys `storage.ts` defines) — same
data shape, just written to the real `AsyncStorage` on device instead.

## After capturing

Reproduce each concept tile's layout (headline placement, background
treatment) around the real capture — in whatever screenshot-framing tool
you use (Figma, Screenshots.pro, Fastlane `frameit`, etc.), not by
re-editing pixels of the capture itself. Keep the concept artifact open
side-by-side as the layout reference; it stays where it is, nothing to
save from it into the repo.
