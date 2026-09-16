import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth, authMode, requiresPassword } from "@/api/auth";
import { migrateLocalDataToUser, setActiveUser } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migration, setMigration] = useState(null);
  const migratedFor = useRef(null);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      // Saved trips and bookings belong to whoever is signed in.
      queryClient.invalidateQueries({ queryKey: ["saved-trips"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    };

    const apply = async (nextUser) => {
      setActiveUser(nextUser?.id ?? null);
      setUser(nextUser);
      refresh();

      if (!nextUser?.id || migratedFor.current === nextUser.id) return;
      migratedFor.current = nextUser.id;

      try {
        const moved = await migrateLocalDataToUser(nextUser.id);
        if (!active) return;
        if (moved.savedTrips || moved.bookings) {
          setMigration(moved);
          refresh();
        }
      } catch {
        // Guest data stays on the device; the user is still signed in.
        migratedFor.current = null;
      }
    };

    auth
      .getUser()
      .then((current) => {
        if (active) apply(current);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = auth.onChange((nextUser) => {
      if (active) apply(nextUser);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authMode,
      requiresPassword,
      isSignedIn: Boolean(user),
      migration,
      dismissMigration: () => setMigration(null),
      signUp: (input) => auth.signUp(input),
      signIn: (input) => auth.signIn(input),
      changePassword: (input) => auth.changePassword(input),
      completePasswordReset: (password) => auth.completePasswordReset(password),
      signOut: () => auth.signOut(),
      resetPassword: (email) => auth.resetPassword(email),
    }),
    [user, loading, migration]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
