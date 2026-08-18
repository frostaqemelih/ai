# Store Listing Package (ASO, copy, screenshots, launch)

Source of truth for App Store / Google Play listing content. Written
2026-08-17. Nothing here is code — this is copy to paste into App Store
Connect / Play Console once accounts exist (see README's "Building for a
real device" section and `docs/DEVICE_TEST_CHECKLIST.md` for what has to
happen first).

## 0. Faz 8 verification note

Confirmed for real this pass (unlike the Faz 1 "AdMob connected" claim,
which wasn't): `adsService.ts` uses real `react-native-google-mobile-ads`
and only grants a reward after `EARNED_REWARD`, never on a bare `CLOSED` or
load failure; `setNonPersonalizedAdsOnly` is wired to ATT status via
`AppDataContext`, defaulting to non-personalized; `SessionScreen` gates
keep-awake behind `settings.keepScreenAwakeEnabled` and documents the
`inactive`-vs-`background` distinction; `eas.json` has three build
profiles and `app.config.js` has a bundle identifier and AdMob plugin
block with Google's test IDs as fallback. No code work remains — the
bottleneck is now the store listing and device testing, not the app.

## 1. App Store vs. Google Play — not the same game

|                          | App Store                              | Google Play        |
| ------------------------ | --------------------------------------- | ------------------- |
| Indexed for search        | Title + subtitle + keyword field only   | Full description text |
| Description's search effect | Zero — not indexed at all             | High                |
| Emoji                     | Banned in every field                   | Allowed outside title/icon |

App Store description is persuasion-only; Play's description is both
persuasion *and* ranking. Copy-pasting the same text into both costs Play
ranking. Kept them separate below for that reason.

2026 character limits — App Store: title 30, subtitle 30, keywords 100,
promotional text 170, description 4000. Play: title 30, short description
80, full description 4000, release notes 500.

## 2. App Store copy (English)

**Title — 24/30**
> Don't Touch: Phone Detox

Brand name alone doesn't get searched; "phone detox" earns real search
volume in the highest-weighted field.
Alternatives: *Don't Touch: Screen Time* (24) · *Don't Touch: Focus Timer* (24)

**Subtitle — 27/30**
> Screen time focus challenge

"screen time" and "focus" land in the second-strongest field. Apple
auto-combines terms across title+subtitle, so "phone focus", "screen
detox", "time challenge" etc. are already covered — no need to repeat them.

**Keyword field — 95/100**
```
addiction,scrolling,selfcontrol,discipline,willpower,streak,study,habit,unplug,quit,block,timer
```
Rules (breaking these wastes the field):
- Comma-separate, no spaces — every space costs a character
- Single words, not phrases; Apple recombines words itself
- Never repeat words already in title/subtitle (don't, touch, phone,
  detox, screen, time, focus, challenge are deliberately absent here)
- Never pluralize; singular indexes the plural too
- "app", "free", category names, and prepositions all waste space

**Promotional text — 104/170**
> Put your phone down and start the timer. Touch the screen and it's over.
> How long can you actually last?

Doesn't affect ranking, but can be changed without a new build — use it
for campaigns, sales, or seasonal messaging.

**Description (persuasion copy, not indexed)**
```
You already know how much time you lose to your phone. This is a way to
find out how long you can go without it.

Pick a goal. Put the phone down. The timer starts.

Touch the screen and the run ends. Leave the app and the run ends. That's
the whole rule.

WHAT HAPPENS DURING A RUN
As the minutes pass the screen shifts from calm to red, the pulse gets
faster, and the app starts trying to break you: "Someone might have
messaged you." "Just one tap." None of it is a real button. Touching it
ends your run like anything else.

BUILD SOMETHING YOU DON'T WANT TO BREAK
Every completed run feeds a daily streak. Hit 7, 30, 100 and 365 days for
rewards. Earn coins for every minute you survive and spend them on streak
freezes and cosmetics. Unlock achievements. Beat your own record.

CHALLENGE A FRIEND
Start a duel and see who lasts longer. Keep a shared streak going with
someone who's trying to do the same thing.

NO ACCOUNT. NO PERMISSIONS. NO TRACKING.
Don't Touch doesn't ask to see your contacts, your usage data, or your
apps. It doesn't lock your phone or install a profile. Your history stays
on your device. There's nothing to sign up for.

PREMIUM
Remove ads, unlock runs up to 24 hours, get monthly and 3-month trend
stats, and unlock premium themes. Available monthly, yearly, or as a
one-time lifetime purchase.

How long can you last?
```

## 3. Google Play copy (English)

**Title — 24/30**
> Don't Touch: Phone Detox

**Short description — 65/80**
> Put the phone down. Touch it and you lose. How long can you last?

**Full description (this text IS indexed — keywords must read as natural sentences)**
```
Don't Touch is a screen time app built as a challenge instead of a
blocker. No permissions, no account, no tracking — just a timer and your
own willpower.

HOW IT WORKS
Choose a focus goal, put your phone down, and the timer starts. Touch the
screen or leave the app and the run ends. That's the only rule.

A REAL TEST OF SELF CONTROL
As your focus session gets longer the screen turns red and the app starts
tempting you to break: "Someone might have messaged you." "Just one tap."
Resisting is the entire game. If you struggle with phone addiction,
doomscrolling, or just want to quit checking your phone every few minutes,
this builds the habit through practice rather than by blocking apps.

STREAKS, COINS AND ACHIEVEMENTS
Every completed session extends your daily streak. Reach 7, 30, 100 and
365 day milestones for rewards. Earn coins for each minute of screen time
you avoid and spend them on streak freezes and cosmetic themes. Track your
personal best, weekly focus time, and long-term trends.

DUEL A FRIEND
Challenge someone to a head-to-head run and see who lasts longer, or keep
a shared daily streak going together. Great for study sessions, work
focus, digital detox challenges, or just proving a point.

PRIVACY BY DEFAULT
Unlike most screen time and app blocker tools, Don't Touch asks for no
usage permissions and creates no account. Your session history stays on
your device. Social features are entirely optional and off until you turn
them on.

PREMIUM
Go ad-free, unlock focus sessions up to 24 hours, see monthly and 3-month
statistics, and unlock premium themes. Monthly, annual and lifetime
options available.

Put it down. Don't touch it. See how long you last.
```

"screen time", "phone addiction", "self control", "focus session",
"digital detox", "app blocker", "doomscrolling", "streak", "habit", and
"study" all appear as natural sentences — required for Play's indexing;
a pasted keyword list reads as spam and gets penalized.

## 4. Turkish copy

- App Store title (27/30): **Don't Touch: Telefon Detoks**
- Subtitle (28/30): **Ekran süresi odak mücadelesi**
- Keywords: `bağımlılık,kaydırma,özdenetim,disiplin,irade,seri,ders,alışkanlık,odaklan,bırak`
- Play short description (64/80): **Telefonu bırak. Dokunursan kaybedersin. Ne kadar dayanabilirsin?**

Don't machine-translate the English description word-for-word — terms like
"doomscrolling" have no Turkish search equivalent. What's actually searched
in Turkey: "ekran süresi", "telefon bağımlılığı", "odaklanma", "pomodoro",
"ders çalışma", "dikkat dağınıklığı".

## 5. Screenshots — the single biggest lever on conversion

Most users never read the description; the first 2–3 screenshots decide.
Every one needs a large, legible headline overlaid on top (the screenshot
itself reads small; the headline text is what actually gets read).

| # | Shows | Headline |
| - | ----- | -------- |
| 1 | Session screen, red "UNTOUCHABLE" level, timer at 47:12 | HOW LONG CAN YOU LAST? |
| 2 | Home screen, large streak count (🔥 34) | A STREAK YOU WON'T WANT TO BREAK |
| 3 | Temptation message on screen: "Someone might have messaged you." | IT WILL TRY TO BREAK YOU |
| 4 | Result screen, PERSONAL BEST badge + confetti | BEAT YOUR OWN RECORD |
| 5 | Duel screen, two-user comparison | CHALLENGE A FRIEND |
| 6 | Stats screen, weekly chart | SEE WHERE YOUR TIME GOES |
| 7 | Settings, "NO ACCOUNT REQUIRED" box | NO ACCOUNT. NO PERMISSIONS. |

#7 matters most: every competitor asks for permissions, this app doesn't —
a real differentiator in the category, and showing it as a screenshot
lands harder than a line of description text.

**Technical note**: capture from a real device (simulator screenshots can
get rejected by Apple), prepare at minimum both 6.7" and 6.5" iPhone sizes.
An App Preview video meaningfully lifts conversion — and since a plain
screen recording of this app is already a good video, no separate
production is needed.

## 6. Category, age rating, privacy

- **Primary category**: Health & Fitness (where "screen time" search
  volume concentrates) — **secondary**: Productivity. Ranking is harder
  in Productivity, so Health & Fitness as primary is the recommendation.
- **Age rating**: 4+ / Everyone. Play requires the "Contains ads" flag
  since the app shows ads.
- **Privacy labels**: use the table already in the README. Since ads and
  analytics are now integrated, "Data Not Collected" can no longer be
  declared — but "Data Not Linked to You" can, and that's still a strong
  position. A false declaration is a rejection reason.
- **Release notes (What's New)**, first release:
  > First release. Put your phone down and see how long you last.

## 7. Launch sequence

1. Development build → work through the device test checklist → fix bugs
2. Apple Developer + Play Console accounts, define products, link to
   RevenueCat
3. Distribute a preview build to 5–10 friends — don't ship to the store
   without real user feedback first
4. Screenshots + copy (this document)
5. Production build → `eas submit`
6. Leave the release "manual" — don't publish the instant review clears;
   time it to land the same day as TikTok content and a Product Hunt launch
7. First week: track reviews daily, ship a fast update for the first 1–2
   bugs found (Apple approves early updates quickly)

## 8. TikTok content plan

As noted in the earlier strategy document, TikTok is the primary discovery
channel for this category, and the app's own screen recording is directly
usable as content. Start posting 2–3 weeks before launch — a launch-day
video from an account with no history barely gets distributed.

**First 10 video ideas:**
1. Screen shifting green → red, pulse speeding up, timer 00:00 → 30:00 —
   sound effect only, no voiceover
2. "I made this app so I can't touch my phone" — text over screen recording
3. The moment a temptation message appears: "Someone might have messaged
   you" — text growing on screen
4. "I did this every day for 30 days" — streak screen, fast 1→30 count-up
5. Duel with a friend: two phones side by side, who touches first
6. "Can you last 1 hour?" — starts on goal-select, ends on the result
7. Reply-to-comment format: "What if I turn off the phone?" — show how
   the app catches backgrounding
8. The failure moment: touching at 58:40, "SESSION OVER" screen — failure
   outperforms success for watch time
9. Stats screen: "how much phone-free time I got this week"
10. A short "indie developer" video about how the app was built — this
    audience responds to builder stories

**Cadence**: 4–5 videos/week, each 15–25 seconds, red screen or the timer
visible in the first second. Store link in bio, app name pinned as a
comment on every video.

## 9. What's next

Store side is ready with this document. What's actually left is building
and device-testing — the part that needs Expo/Apple/Google accounts and
can't be done from here. If device testing turns up bugs, bring the output
back for a fix. Screenshot visual design (headline placement, backgrounds)
can be prepared here on request.
