/*
 * Squid Ink — AdsBridge (ad-readiness stub)
 * ==========================================
 * This file is NOT loaded by index.html and changes NOTHING about the web
 * game. It is the seam where a future mobile wrapper (Capacitor) connects
 * native AdMob to the game's screen states, so that ad wiring never has to
 * touch game code.
 *
 * Behaviour here is deliberately a pure NO-OP in any plain browser:
 * AdMob is a mobile SDK — it cannot and must not serve anything on the web.
 * (If you ever want web ads, that is Google AdSense / Ad Manager for Games,
 * a different product and out of scope.)
 *
 * In a Capacitor-wrapped build, replace the `if (isWeb)` early-returns with
 * real calls to @capacitor-community/admob (see ADMOB-README.md for the
 * copy-paste implementation). Keep the public API identical.
 *
 * Public API (all no-ops off-device):
 *   SquidAds.configure(configObject)  // load admob.config.json
 *   SquidAds.enable() / disable()     // master switch; disabled by default
 *   SquidAds.screenChanged(name)      // 'ready' | 'flying' | 'dead' | 'paused'
 *   SquidAds.state()                  // {enabled, screen, bannerVisible}
 *
 * Screen-policy (hard requirements, do not "improve"):
 *   - banner VISIBLE only on 'ready' (start) and 'dead' (game-over) screens
 *   - banner HIDDEN during 'flying' and 'paused' — flapping is tap-anywhere;
 *     an ad during play would cause mis-clicks (AdMob placement policy) and
 *     fight the game's no-pressure design.
 */
(function () {
  "use strict";

  var isNative =
    typeof window !== "undefined" && !!window.Capacitor; // true only inside a Capacitor shell

  var state = { enabled: false, config: null, screen: "ready", bannerVisible: false };

  function log() {
    var a = ["[SquidAds]"];
    for (var i = 0; i < arguments.length; i++) a.push(arguments[i]);
    if (window.console && console.info) console.info.apply(console, a);
  }

  var SquidAds = {
    configure: function (config) {
      state.config = config || null;
      if (config && config.mode !== "development") {
        log("refusing to enable: mode must be 'development' until production IDs are verified");
        state.enabled = false;
        return;
      }
      log("configured (mode=" + (config && config.mode) + ", app-id=" +
          (config ? maskId(config.testAppId) : "?") + ")");
    },

    enable: function () {
      if (!state.config) { log("enable ignored — call configure() first"); return; }
      if (!isNative) {
        log("no-op in browser: AdMob cannot run on the web. Wrapping the game in Capacitor is a prerequisite (see ADMOB-README.md).");
        return;
      }
      state.enabled = true;
      // NATIVE HOOK — implemented in the wrapper, e.g.:
      //   await AdMob.initialize({ initializeForTesting: true });
      //   await requestConsentViaUMP(state.config.privacy);
      log("enabled");
    },

    disable: function () {
      state.enabled = false;
      SquidAds.screenChanged("flying"); // guarantees banner off
    },

    screenChanged: function (name) {
      state.screen = name;
      var want = state.enabled &&
                 (name === "ready" || name === "dead");
      if (want === state.bannerVisible) return;
      state.bannerVisible = want;
      if (!isNative) return; // no-op on web — this line keeps browser behavior byte-identical
      // NATIVE HOOK:
      //   want ? showBanner(state.config) : hideBanner();
      log("banner " + (want ? "would show" : "would hide") + " (screen=" + name + ")");
    },

    state: function () { return { enabled: state.enabled, screen: state.screen, bannerVisible: state.bannerVisible }; }
  };

  function maskId(id) { return id ? String(id).slice(0, 12) + "…" : "—"; }

  // The wrapper's Capacitor bridge dispatches these events after the game
  // changes screen; index.html remains untouched either way.
  if (typeof window !== "undefined") {
    window.SquidAds = SquidAds;
    window.addEventListener("squid:screen", function (e) { SquidAds.screenChanged(e.detail && e.detail.screen); });
  }
})();
