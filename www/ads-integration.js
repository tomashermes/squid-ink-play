/*
 * Squid Ink (Play wrapper) — ads-integration.js
 * ==============================================
 * Lives ONLY in this wrapper (www/), not in the game repo. Two jobs:
 *  1) Observe the game's three overlay screens (MutationObserver on the
 *     'hidden' class) and report screen names to SquidAds — zero game-code
 *     surgery.
 *  2) On a native (Capacitor) build only, drive @capacitor-community/admob
 *     with Google's OFFICIAL demo banner unit while TESTING=true.
 *
 * Rules encoded here (do not loosen without re-reading ADMOB-README in
 * ../squid-ink and PUBLISH.md):
 *  - banner ONLY on 'ready' (start) and 'dead' (game-over) screens;
 *  - never shown during 'flying' or 'paused';
 *  - no interstitials, no rewarded, no app-open ads;
 *  - web browser = total no-op (AdMob is mobile-only).
 */
(function () {
  "use strict";

  /* ================= configuration (dev defaults, safe) ================ */
  var TESTING = true; // flip false ONLY after production IDs + test devices are set (PUBLISH.md step 2)

  // Google OFFICIAL demo units — developers.google.com/admob (verified 15.11.2026).
  var DEMO_ANDROID_BANNER = "ca-app-pub-3940256099942544/9214589741"; // anchored adaptive banner
  var PRODUCTION_ANDROID_BANNER = "REPLACE_ME"; // from AdMob console → your banner unit
  // AdMob APPLICATION id lives in android/app/src/main/AndroidManifest.xml
  // (meta-data com.google.android.gms.ads.APPLICATION_ID). Swap ~145800 test id
  // for your own before release.
  /* ====================================================================== */

  var cap = window.Capacitor;
  var isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var AdMob = isNative && cap.Plugins ? cap.Plugins.AdMob : null;

  function screenFromDom() {
    var s = document.getElementById("startScreen");
    var o = document.getElementById("overScreen");
    var p = document.getElementById("pauseScreen");
    if (!s || !o || !p) return "ready";
    if (!s.hidden && s.className.indexOf("hidden") === -1) return "ready";
    if (o.className.indexOf("hidden") === -1) return "dead";
    if (p.className.indexOf("hidden") === -1) return "paused";
    return "flying";
  }

  var lastScreen = null;
  function publish(screen) {
    if (screen === lastScreen) return;
    lastScreen = screen;
    if (window.SquidAds) window.SquidAds.screenChanged(screen);
    if (!AdMob) return; // web / plugin-missing: no-op, game unaffected
    var wantBanner = (screen === "ready" || screen === "dead");
    try {
      if (wantBanner) showBanner(); else hideBanner();
    } catch (e) { console.info("[squid-ads]", e && e.message); }
  }

  var bannerUp = false;
  function showBanner() {
    if (bannerUp || !AdMob) return;
    AdMob.showBanner({
      adId: TESTING ? DEMO_ANDROID_BANNER : PRODUCTION_ANDROID_BANNER,
      adSize: AdMob.BannerAdSize ? AdMob.BannerAdSize.ADAPTIVE_BANNER : "ADAPTIVE_BANNER",
      position: AdMob.BannerAdPosition ? AdMob.BannerAdPosition.BOTTOM_CENTER : "BOTTOM_CENTER",
      margin: 0,
      isTesting: TESTING,
      // To see production-shaped ads on your own phone BEFORE release, also add
      // your device GAID here and register it in the AdMob console:
      testDeviceIds: []
    }).then(function () { bannerUp = true; })
      .catch(function (e) { console.info("[squid-ads] banner unavailable:", e && e.message); });
  }
  function hideBanner() {
    if (!AdMob) return;
    bannerUp = false;
    AdMob.hideBanner().catch(function () {});
  }

  function boot() {
    // One-time native init with testing flag (loads Mobile Ads SDK).
    if (AdMob) {
      AdMob.initialize({ initializeForTesting: TESTING }).catch(function (e) {
        console.info("[squid-ads] init failed:", e && e.message);
      });
    }
    var stage = document.getElementById("stage") || document.body;
    ["startScreen", "overScreen", "pauseScreen"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(function () { publish(screenFromDom()); })
        .observe(el, { attributes: true, attributeFilter: ["class"] });
    });
    publish(screenFromDom());
    // never let ad logic break the game loop
    window.addEventListener("beforeunload", function () {
      if (AdMob) { try { AdMob.removeBanner(); } catch (e) {} }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
