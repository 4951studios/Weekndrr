import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

// Password reset / email confirmation links open the app via this custom scheme
// since there's no hosted web build to redirect to (native-only distribution).
export const APP_URL_SCHEME = "com.weekndrr.myapp";

/** Registers a handler for links that open the app (e.g. auth email redirects).
 * `onUrl` receives the path + query/hash exactly as react-router expects, e.g. "/reset-password?code=...". */
export async function listenForAppUrlOpen(onUrl) {
  if (!isNative) return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);
        onUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      } catch {
        /* malformed deep link */
      }
    });
    return () => handle.remove();
  } catch {
    return () => {};
  }
}

/** Initialize Google Mobile Ads in test mode until production app IDs are supplied. */
export async function initAdMob() {
  if (!isNative) return;
  try {
    const { AdMob, MaxAdContentRating } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      initializeForTesting: true,
      maxAdContentRating: MaxAdContentRating.General,
    });
  } catch {
    /* AdMob is optional and unavailable during some native startup states */
  }
}

/** Status bar setup. No-op on the web. */
export async function initNativeShell() {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");

  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  } catch {
    /* status bar unavailable on this device */
  }
}

/** Called once the web splash is on screen so the handoff has no white flash. */
export async function hideNativeSplash() {
  if (!isNative) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash already hidden */
  }
}

/** Resolves to { latitude, longitude } or null if unavailable/denied/slow. */
export async function getCoordinates() {
  // Native providers can hang indefinitely without a fix, so always bound the wait.
  return Promise.race([
    requestCoordinates(),
    new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
  ]);
}

async function requestCoordinates() {
  if (isNative) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== "granted") {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== "granted") return null;
      }
      const position = await Geolocation.getCurrentPosition({ timeout: 8000 });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return null;
    }
  }

  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

/** Returns "shared" | "copied" | "failed". */
export async function shareLink({ title, url }) {
  if (isNative) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, url, dialogTitle: title });
      return "shared";
    } catch {
      return "failed";
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch {
      return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export async function tapFeedback() {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics unsupported */
  }
}

/** Opens a booking site in the system browser / in-app browser. */
export async function openExternal(url) {
  if (isNative) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    } catch {
      /* fall through to the web behaviour */
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
