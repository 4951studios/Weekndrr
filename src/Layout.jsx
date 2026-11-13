import { useEffect, useRef } from "react";
import { Heart, Search, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { setBannerPlacement, suppressBanner } from "@/lib/ads";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Explore", icon: Search },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const hideNav =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/confirmation") ||
    pathname.startsWith("/email-confirmation") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-password");
  const tabsRef = useRef(null);

  useEffect(() => {
    // The ad is docked directly above the tab bar's content (the native view already
    // accounts for the bottom safe area), and hidden on screens without the tab bar.
    const tabs = tabsRef.current;
    setBannerPlacement({
      visible: !hideNav,
      margin: tabs ? Math.ceil(tabs.getBoundingClientRect().height) + 1 : 0,
    });
  }, [hideNav]);

  useEffect(() => {
    // On Android the keyboard pushes native views up over the form being typed in.
    let release = null;
    const isTextField = (el) =>
      el?.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, [contenteditable=true]");
    const onFocusIn = (event) => {
      if (isTextField(event.target) && !release) release = suppressBanner();
    };
    const onFocusOut = (event) => {
      if (!isTextField(event.relatedTarget)) {
        release?.();
        release = null;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      release?.();
    };
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className={cn("mx-auto w-full max-w-lg", !hideNav && "pb-with-ad")}>
        {children}
      </div>

      {!hideNav && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl pb-safe"
        >
          <ul ref={tabsRef} className="mx-auto flex w-full max-w-lg items-stretch">
            {TABS.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-slate-400 hover:text-slate-600"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="h-5 w-5"
                        aria-hidden="true"
                        fill={isActive && label === "Saved" ? "currentColor" : "none"}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
