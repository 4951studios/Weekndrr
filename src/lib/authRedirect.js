const KEY = "weekender:post-auth-redirect";

// Only in-app paths are allowed so a stored value can never redirect off-site.
function isSafePath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

/** Remembers where to send the user after they finish signing in or confirming email. */
export function rememberPostAuthRedirect(path) {
  try {
    if (isSafePath(path)) window.localStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable */
  }
}

export function peekPostAuthRedirect() {
  try {
    const path = window.localStorage.getItem(KEY);
    return isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}

export function consumePostAuthRedirect() {
  const path = peekPostAuthRedirect();
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  return path;
}
