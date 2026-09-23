import { Link } from "react-router-dom";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useBookings, useTrips } from "@/hooks/useEntities";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateRange } from "@/lib/weekends";
import { formatPrice } from "@/utils";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export default function Profile() {
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { data: bookings = [], isError: bookingsError, refetch: retryBookings } =
    useBookings();
  const { data: trips = [] } = useTrips();
  const {
    user,
    isSignedIn,
    signOut,
    authMode,
    migration,
    dismissMigration,
    changePassword,
    deleteAccount,
  } = useAuth();

  const tripById = Object.fromEntries(trips.map((trip) => [trip.id, trip]));

  const updatePasswordField = (field, value) => {
    setPasswords((current) => ({ ...current, [field]: value }));
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const submitAccountDeletion = async () => {
    setDeletionError(null);
    setDeletingAccount(true);
    try {
      await deleteAccount();
    } catch (error) {
      setDeletionError(error.message ?? "Unable to delete your account.");
      setDeletingAccount(false);
    }
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwords.current) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        email: user.email,
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(error.message ?? "Unable to change your password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl pt-safe">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      </header>

      <main className="space-y-7 px-4 py-5">
        {migration && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">
              Moved into your account:{" "}
              {[
                migration.savedTrips &&
                  `${migration.savedTrips} saved trip${migration.savedTrips === 1 ? "" : "s"}`,
                migration.bookings &&
                  `${migration.bookings} booking${migration.bookings === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" and ")}
              .
            </span>
            <button
              type="button"
              onClick={dismissMigration}
              aria-label="Dismiss"
              className="rounded-full p-0.5 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <section className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-900">
              {isSignedIn ? (user.name ?? "Traveler") : "Guest traveler"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {isSignedIn
                ? user.email
                : "Sign in to sync saved trips and bookings."}
            </p>
          </div>
        </section>

        {isSignedIn ? (
          <div className="space-y-2">
            {authMode === "demo" && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Demo account — stored on this device only.
              </p>
            )}
            {authMode === "supabase" && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  Change password
                </h2>
                <form className="mt-4 space-y-3" onSubmit={submitPasswordChange}>
                  <PasswordField
                    id="current-password"
                    label="Current password"
                    value={passwords.current}
                    onChange={(value) => updatePasswordField("current", value)}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    id="new-password"
                    label="New password"
                    value={passwords.next}
                    onChange={(value) => updatePasswordField("next", value)}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    id="confirm-password"
                    label="Confirm new password"
                    value={passwords.confirm}
                    onChange={(value) => updatePasswordField("confirm", value)}
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p role="alert" className="text-xs font-medium text-rose-600">
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p role="status" className="text-xs font-medium text-emerald-700">
                      Password changed successfully.
                    </p>
                  )}
                  <Button type="submit" variant="outline" disabled={changingPassword}>
                    {changingPassword ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </section>
            )}
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-900">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete account
              </h2>
              {!confirmingDeletion ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                  onClick={() => {
                    setDeletionError(null);
                    setConfirmingDeletion(true);
                  }}
                >
                  Delete my account
                </Button>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="flex items-start gap-2 text-xs text-rose-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    This permanently deletes your account, saved trips, and booking history.
                  </p>
                  {deletionError && (
                    <p role="alert" className="text-xs font-medium text-rose-700">
                      {deletionError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmingDeletion(false)}
                      disabled={deletingAccount}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-rose-600 text-white hover:bg-rose-700"
                      onClick={submitAccountDeletion}
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? "Deleting…" : "Permanently delete"}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link to="/signup" state={{ from: "/profile" }}>
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/signin" state={{ from: "/profile" }}>
                Sign in
              </Link>
            </Button>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Past bookings</h2>

          {bookingsError ? (
            <div role="alert" className="rounded-2xl bg-rose-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-rose-800">
                We couldn’t load your bookings.
              </p>
              <Button variant="outline" className="mt-4" onClick={retryBookings}>
                Try again
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {tripById[booking.trip_id]?.destination ?? "Trip"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(
                          booking.travel_dates.departure,
                          booking.travel_dates.return
                        )}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {booking.confirmation_code}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                          STATUS_STYLES[booking.status]
                        )}
                      >
                        {booking.status}
                      </span>
                      <p className="mt-1.5 text-sm font-bold text-primary">
                        {formatPrice(booking.total_paid)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
