import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();
const supported = platform === "ios" || platform === "android";

// Google's sample ad units. They are safe to use with the real app ID and never
// serve billable ads, so they're the fallback until production units are set in .env.
const TEST_UNITS = {
  android: {
    banner: "ca-app-pub-3940256099942544/9214589741",
    interstitial: "ca-app-pub-3940256099942544/1033173712",
  },
  ios: {
    banner: "ca-app-pub-3940256099942544/2435281174",
    interstitial: "ca-app-pub-3940256099942544/4411468910",
  },
};

const ENV_UNITS = {
  android: {
    banner: import.meta.env.VITE_ADMOB_ANDROID_BANNER_ID,
    interstitial: import.meta.env.VITE_ADMOB_ANDROID_INTERSTITIAL_ID,
  },
  ios: {
    banner: import.meta.env.VITE_ADMOB_IOS_BANNER_ID,
    interstitial: import.meta.env.VITE_ADMOB_IOS_INTERSTITIAL_ID,
  },
};

function adUnit(format) {
  const id = ENV_UNITS[platform]?.[format]?.trim();
  return id
    ? { adId: id, isTesting: false }
    : { adId: TEST_UNITS[platform][format], isTesting: true };
}

// Interstitials show on trip opens, but never more often than this.
const INTERSTITIAL_EVERY_N_TRIPS = 3;
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;

let plugin = null;
let ready = null;
let resolveInitialized;
const initialized = new Promise((resolve) => (resolveInitialized = resolve));
let canRequestAds = false;
let privacyOptionsRequired = false;

async function loadPlugin() {
  plugin ??= await import("@capacitor-community/admob");
  return plugin;
}

/**
 * Collects consent (UMP/GDPR form, then the iOS ATT prompt) and initializes Google
 * Mobile Ads. Must run after the native splash is hidden so prompts are visible.
 * Resolves to whether ads may be requested.
 */
export function initAdMob() {
  if (!supported) return Promise.resolve(false);
  ready ??= (async () => {
    try {
      const { AdMob, AdmobConsentStatus, MaxAdContentRating, PrivacyOptionsRequirementStatus } =
        await loadPlugin();

      let consent = await AdMob.requestConsentInfo().catch(() => null);
      if (
        consent?.status === AdmobConsentStatus.REQUIRED &&
        consent.isConsentFormAvailable
      ) {
        consent = await AdMob.showConsentForm().catch(() => consent);
      }
      privacyOptionsRequired =
        consent?.privacyOptionsRequirementStatus ===
        PrivacyOptionsRequirementStatus.REQUIRED;

      if (platform === "ios") await requestTrackingPermission(AdMob);

      const usingTestUnits = adUnit("banner").isTesting || adUnit("interstitial").isTesting;
      await AdMob.initialize({
        initializeForTesting: usingTestUnits,
        maxAdContentRating: MaxAdContentRating.General,
      });

      // If the consent service is unreachable, fall back to requesting ads (Google
      // only serves non-personalized ads without a stored consent signal).
      canRequestAds = consent ? consent.canRequestAds : true;
      if (canRequestAds) {
        await registerListeners(AdMob);
        prepareInterstitial();
        syncBanner();
      }
    } catch {
      canRequestAds = false;
    }
    resolveInitialized();
    return canRequestAds;
  })();
  return ready;
}

async function requestTrackingPermission(AdMob) {
  // iOS silently ignores the request unless the app is in the foreground and active,
  // so retry on the next activation if the first attempt didn't show the prompt.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { status } = await AdMob.trackingAuthorizationStatus();
    if (status !== "notDetermined") return;
    await waitUntilAppActive();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await AdMob.requestTrackingAuthorization();
  }
}

async function waitUntilAppActive() {
  const { App } = await import("@capacitor/app");
  const { isActive } = await App.getState();
  if (isActive) return;
  let handle;
  await new Promise((resolve) => {
    handle = App.addListener("appStateChange", (state) => {
      if (state.isActive) resolve();
    });
  });
  (await handle).remove();
}

async function registerListeners(AdMob) {
  const { BannerAdPluginEvents, InterstitialAdPluginEvents } = plugin;
  await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
    document.documentElement.style.setProperty(
      "--ad-banner-height",
      `${Math.max(0, Math.ceil(height || 0))}px`
    );
  });
  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
    // The native view is torn down on failure; recreate it on the next sync.
    banner.created = false;
    banner.visible = false;
    scheduleBannerRetry();
  });
  await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, onInterstitialClosed);
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, onInterstitialClosed);
}

// ---------------------------------------------------------------------------
// Banner: a single adaptive banner docked above the bottom tab bar. Native views
// render on top of the WebView, so it's hidden while sheets, inputs or
// full-screen ads would otherwise be covered by it.

const banner = {
  wanted: false,
  margin: 0,
  suppressors: 0,
  created: false,
  visible: false,
  retryTimer: null,
};
let bannerQueue = Promise.resolve();

/** Shows/hides the banner for the current screen. `margin` = tab bar height in px. */
export function setBannerPlacement({ visible, margin = 0 }) {
  if (!supported) return;
  if (banner.created && visible && margin !== banner.margin) {
    banner.created = false;
    banner.visible = false;
    enqueue(({ AdMob }) => AdMob.removeBanner());
  }
  banner.wanted = visible;
  banner.margin = margin;
  syncBanner();
}

/** Temporarily hides the banner (e.g. while a bottom sheet is open). Returns a release fn. */
export function suppressBanner() {
  if (!supported) return () => {};
  banner.suppressors += 1;
  syncBanner();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    banner.suppressors -= 1;
    syncBanner();
  };
}

function enqueue(task) {
  bannerQueue = bannerQueue
    .then(() => task(plugin))
    .catch(() => {});
  return bannerQueue;
}

function syncBanner() {
  if (!canRequestAds || !plugin) return;
  enqueue(async ({ AdMob, BannerAdPosition, BannerAdSize }) => {
    const shouldShow = banner.wanted && banner.suppressors === 0;
    if (shouldShow === banner.visible) return;

    if (!shouldShow) {
      banner.visible = false;
      if (banner.created) await AdMob.hideBanner();
      return;
    }

    banner.visible = true;
    if (banner.created) {
      try {
        await AdMob.resumeBanner();
        return;
      } catch {
        banner.created = false;
      }
    }
    banner.created = true;
    await AdMob.showBanner({
      ...adUnit("banner"),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: banner.margin,
    });
  });
}

function scheduleBannerRetry() {
  window.clearTimeout(banner.retryTimer);
  banner.retryTimer = window.setTimeout(syncBanner, 60 * 1000);
}

// ---------------------------------------------------------------------------
// Interstitial: preloaded, then shown on a trip open with frequency caps.

const interstitial = {
  loaded: false,
  loading: false,
  tripOpens: 0,
  lastShownAt: 0,
  release: null,
};

async function prepareInterstitial() {
  if (!canRequestAds || interstitial.loaded || interstitial.loading) return;
  interstitial.loading = true;
  try {
    await plugin.AdMob.prepareInterstitial(adUnit("interstitial"));
    interstitial.loaded = true;
  } catch {
    interstitial.loaded = false;
  } finally {
    interstitial.loading = false;
  }
}

function onInterstitialClosed() {
  interstitial.loaded = false;
  interstitial.release?.();
  interstitial.release = null;
  prepareInterstitial();
}

/** Call when a trip is opened. Shows a preloaded interstitial if the frequency caps allow. */
export async function maybeShowInterstitial() {
  if (!supported || !canRequestAds) return;
  interstitial.tripOpens += 1;
  const dueByCount = interstitial.tripOpens % INTERSTITIAL_EVERY_N_TRIPS === 0;
  const dueByTime = Date.now() - interstitial.lastShownAt >= INTERSTITIAL_MIN_INTERVAL_MS;
  if (!dueByCount || !dueByTime) return;

  if (!interstitial.loaded) {
    prepareInterstitial();
    return;
  }

  interstitial.lastShownAt = Date.now();
  interstitial.release = suppressBanner();
  try {
    await plugin.AdMob.showInterstitial();
  } catch {
    onInterstitialClosed();
  }
}

// ---------------------------------------------------------------------------
// GDPR: users in regions that require it must be able to revisit their choices.

export async function isAdPrivacyOptionsRequired() {
  if (!supported) return false;
  await initialized;
  return privacyOptionsRequired;
}

export async function showAdPrivacyOptions() {
  if (!supported) return;
  const { AdMob } = await loadPlugin();
  await AdMob.showPrivacyOptionsForm();
  const consent = await AdMob.requestConsentInfo().catch(() => null);
  if (consent && !consent.canRequestAds && canRequestAds) {
    canRequestAds = false;
    banner.created = false;
    banner.visible = false;
    await enqueue(({ AdMob: admob }) => admob.removeBanner());
  }
}
