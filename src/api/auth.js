import { supabase, supabaseEnabled } from "@/api/supabase";
import { APP_URL_SCHEME, isNative } from "@/lib/native";

/**
 * Auth interface used by the UI. Backed by Supabase when configured; otherwise a
 * device-only demo profile so the app still runs with no backend.
 *
 * Demo mode deliberately stores no password and grants no real security — it only
 * remembers a display name and email on this device.
 */

const DEMO_KEY = "weekender:demo_account";
const demoListeners = new Set();

function resolveSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return parsed.origin;
      }
    } catch {
      // Fall through to the guarded local fallback below.
    }
  }

  if (isNative) return `${APP_URL_SCHEME}://`;

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    throw new Error(
      "Set VITE_SITE_URL to the real app URL before sending auth emails."
    );
  }

  return window.location.origin;
}

// There's no hosted web build to redirect to, so email links must open the native
// app via its custom URL scheme instead of `window.location.origin`.
function siteUrl(path = "") {
  const base = resolveSiteUrl();
  return path ? `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : base;
}

export const authMode = supabaseEnabled ? "supabase" : "demo";
export const requiresPassword = supabaseEnabled;

function readDemoUser() {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoUser(user) {
  try {
    if (user) window.localStorage.setItem(DEMO_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(DEMO_KEY);
  } catch {
    /* storage unavailable */
  }
  demoListeners.forEach((listener) => listener(user));
}

function normalize(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.name ?? null,
  };
}

export const auth = {
  async getUser() {
    if (!supabaseEnabled) return readDemoUser();
    const { data } = await supabase.auth.getUser();
    return normalize(data?.user);
  },

  async signUp({ email, password, name }) {
    if (!supabaseEnabled) {
      const user = { id: `demo-${email}`, email, name };
      writeDemoUser(user);
      return { user, needsConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: siteUrl("/signin") },
    });
    if (error) throw new Error(error.message);

    return {
      user: normalize(data.user),
      // Supabase returns no session when email confirmation is switched on.
      needsConfirmation: Boolean(data.user) && !data.session,
    };
  },

  async signIn({ email, password }) {
    if (!supabaseEnabled) {
      const existing = readDemoUser();
      const user = { id: `demo-${email}`, email, name: existing?.name ?? null };
      writeDemoUser(user);
      return { user };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return { user: normalize(data.user) };
  },

  async signOut() {
    if (!supabaseEnabled) {
      writeDemoUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async resetPassword(email) {
    if (!supabaseEnabled) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl("/reset-password"),
    });
    if (error) throw new Error(error.message);
  },

  async completePasswordReset(newPassword) {
    if (!supabaseEnabled) {
      throw new Error("Password recovery requires a connected account.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  async changePassword({ email, currentPassword, newPassword }) {
    if (!supabaseEnabled) {
      throw new Error("Password changes require a connected account.");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) throw new Error("Your current password is incorrect.");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  },

  onChange(callback) {
    if (!supabaseEnabled) {
      demoListeners.add(callback);
      return () => demoListeners.delete(callback);
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(normalize(session?.user));
    });
    return () => data?.subscription?.unsubscribe();
  },
};
