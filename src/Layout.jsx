import { Heart, Search, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-password");

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className={cn("mx-auto w-full max-w-lg", !hideNav && "pb-24")}>
        {children}
      </div>

      {!hideNav && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl pb-safe"
        >
          <ul className="mx-auto flex w-full max-w-lg items-stretch">
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
