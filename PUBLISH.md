# Publishing Squid Ink on Google Play — step by step (you do these; nobody can for you)

Working names used throughout: app package `com.tomashermes.squidink` (set in
`capacitor.config.json` — **once you upload to Play this package name is
permanent**, choose deliberately).

---

## STEP 2a — AdMob console (≈15 min, free)

1. Go to **https://admob.google.com** → sign in with your Google account →
   accept the AdMob terms.
2. **Apps → Add app** → name `Squid Ink`, platform **Android**, "Add an app
   already published to the Play Store?" → *No / not yet* (fine).
3. AdMob shows your **Application ID** `ca-app-pub-XXXXXXXXXXXX~YYYYYYYYYY`.
   Copy it.
4. **Ad units → Add ad unit** → format **Banner**, name `menu-banner`,
   **do not** enable "Require app links…". Copy the **unit ID**
   `ca-app-pub-XXXX/YYYYYYYYYY`.
5. **Settings → Test devices → Add device**: enter your phone's **GAID** —
   easiest: run the debug APK once with `TESTING=false`; AdMob logs show a
   "Use this device for testing" dialog → tap it (or read GAID from logcat:
   `adb shell settings get secure advertising_id`). Emulators don't need this
   (auto test mode).
6. Wire production IDs (2 places, no secrets in git — `admob.config.json` is
   gitignored, and the manifest edit is yours pre-release):
   - `www/ads-integration.js`: `TESTING = false`,
     `PRODUCTION_ANDROID_BANNER = "<your unit ID>"`.
   - `android/app/src/main/AndroidManifest.xml`: replace the demo
     `com.google.android.gms.ads.APPLICATION_ID` value with **your App ID**.
7. ⚠️ Never click your own live ads. Clicking on your production banner
   without your device registered as a test device → invalid-activity flag.

## STEP 2b — Google Play Console (≈1–2 h + review days)

1. **https://play.google.com/console** → create developer account —
   **one-time US$25**, ID verification for individual accounts.
2. **Create app**: name `Squid Ink`, Language, **App**, **Free**,
   check "Ads". (Play charges no listing fee.)
3. Mandatory setup pages, in the order Play nags (left-nav "Release →
   Production" shows the red warnings):
   - **App access**: no login needed → declare so.
   - **App content**:
     - *Privacy policy*: **mandatory once the app shows ads** — a public URL.
       One-page static text is enough (template below in §C).
     - *Ads declaration*: yes, **Google AdMob**.
     - *Data safety form*: declare **Google Mobile Ads SDK** — use the
       Google-published declaration values (collects device identifiers,
       ad-interaction data; not encrypted in transit by you; no user deletion
       API needed beyond opting out — copy the exact form answers from Google's
       Play Console help "Data safety disclosures" for the Mobile Ads SDK;
       do NOT wing each checkbox).
     - *Target audience*: set **13+ only** and **do not** select the
       Families/children program — keeps you out of Family-policy obligations
       (personalized ads for under-13 require COPPA-certified setups you don't
       have). ⚠️ This contradicts nothing in the game, but the store takes
       accuracy seriously.
     - *Content rating (IARC)*: answer the questionnaire — this game is
       violence-free → Everyone/PEGI 3.
   - **Store listing**: icon (generate proper assets with
     `npx @capacitor/assets generate --android` using a 1024px art file),
     short/full description, ≥2 screenshots (take them from the debug build).
4. **Release setup**:
   - *App signing by Play* = **yes** (Play holds your upload key; safer).
   - Create an **upload keystore** (never commit it; `*.jks` is gitignored):
     `keytool -genkey -v -keystore squidink-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
     — back the keystore + password up somewhere you won't lose (losing it =
     losing the app).
   - Build the **AAB**: `npm run bundle` → `android/app/build/outputs/bundle/release/app-release.aab`
     (first, wire signingConfigs in `android/app/build.gradle` — Play rejects
     debug-signed releases).
   - First uploads go to **Internal testing** (invite yourself by email) →
     verify banner shows on start/game-over only, UMP-less test ads fine, then
     promote to Production. Review takes 1–7 days (first release often faster).

## STEP 3 — Policy verification before you press Publish

Checklist (all verifiable in 20 min of clicking around your own build):

- [ ] Banner **absent** during gameplay and while paused (watch 3 runs)
- [ ] Banner not overlapping music/pause buttons or "Dive" button (≥48 dp gap)
- [ ] No interstitial/reward/app-open code shipped (grep: none in www/)
- [ ] Store description makes no claims about the ads ("distraction-free
      flappy" would clash with a visible menu banner — keep copy neutral)
- [ ] README of **the game repo** already discloses ad readiness (done —
      `squid-ink/README.md § AdMob readiness`); the game-law section says a
      rewarded revive would violate design; none exists ✓
- [ ] Test ads removed before production build (TESTING=false, demo IDs
      gone) — or keep your device registered if you prefer test-only builds
- [ ] GAID opt-out respected (Mobile Ads SDK handles automatically)
- [ ] Data-safety answers = exactly what the Google Mobile Ads SDK does
      (their published disclosure, not your guesses)
- [ ] Privacy policy URL live and mentions Google AdMob + "advertising ID"
      + opt-out link (Settings→Google→Ads→Opt out)
- [ ] You did NOT commit any production IDs/keystore (`git log -p | grep ca-app-pub-<yourpublisher>` → only demo publisher `3940256099942544` may appear)

**ATT/iOS SKAdNetwork: N/A** — Android-only for now; revisit only if you later
wrap iOS (see `squid-ink/ads/ADMOB-README.md` §2/§4).

## Known limits of THIS repo's verification

The build produces and runs a **debug APK on Android with Google demo ads**;
I cannot verify store review outcomes, and UMP consent-form wiring (needed for
EEA *personalized* ads; harmless without since we default to
non-personalized/test mode) is intentionally left as a pre-release task
documented above — adding it before the AdMob account exists has nothing to
point at.
