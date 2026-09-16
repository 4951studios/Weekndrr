import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Info, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/api/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({ mode }) {
  const isSignUp = mode === "signup";
  const isReset = mode === "reset";
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signUp,
    signIn,
    resetPassword,
    completePasswordReset,
    requiresPassword,
  } = useAuth();

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  // "none": not a recovery link. "verifying": link present, confirming the session.
  // "ready": session confirmed, show the new-password form. "invalid": link expired/reused.
  const [recoveryStatus, setRecoveryStatus] = useState(() => {
    if (!isReset) return "none";
    const hasLink =
      window.location.hash.includes("access_token") ||
      new URLSearchParams(window.location.search).has("code");
    return hasLink ? "verifying" : "none";
  });
  const recoverySession = recoveryStatus === "ready";

  useEffect(() => {
    if (recoveryStatus !== "verifying" || !supabase) return;
    let active = true;
    // getSession() awaits the client's internal URL/code handling before resolving,
    // so this reflects whether the recovery link actually produced a valid session.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setRecoveryStatus(data?.session ? "ready" : "invalid");
    });
    return () => {
      active = false;
    };
  }, [recoveryStatus]);

  const redirectTo = location.state?.from ?? "/profile";

  const update = (field, value) =>
    setValues((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const next = {};
    if (isSignUp && !values.name.trim()) next.name = "Name is required.";
    if (!isReset && !values.email.trim()) next.email = "Email is required.";
    else if (!isReset && !EMAIL_PATTERN.test(values.email))
      next.email = "Enter a valid email.";
    if (requiresPassword && (!isReset || recoverySession)) {
      if (!values.password) next.password = "Password is required.";
      else if (values.password.length < 8)
        next.password = "Use at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isReset && recoverySession) {
        await completePasswordReset(values.password);
        navigate("/profile", { replace: true });
      } else if (isReset) {
        await resetPassword(values.email);
        setResetSent(true);
        return;
      } else if (isSignUp) {
        const result = await signUp(values);
        if (result?.needsConfirmation) {
          setAwaitingConfirmation(true);
          return;
        }
      } else {
        await signIn(values);
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error?.message ?? "";
      setFormError(
        /failed to fetch|networkerror|network request failed/i.test(message)
          ? "Can’t reach the server. Check your connection and try again."
          : message || "Something went wrong. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (recoveryStatus === "verifying") {
    return (
      <div className="px-6 py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">Verifying your link…</p>
      </div>
    );
  }

  if (recoveryStatus === "invalid") {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is invalid or has already been used. Request a
          new one to continue.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/reset-password">Send a new link</Link>
        </Button>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/signin">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (awaitingConfirmation) {
    return (
      <div className="px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <MailCheck className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to {values.email}. Open it to finish creating
          your account.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/signin">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <MailCheck className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for {values.email}, we sent a password reset link.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/signin">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200/70 bg-white/80 px-3 py-2.5 backdrop-blur-xl pt-safe">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">
          {isReset
            ? recoverySession
              ? "Set a new password"
              : "Reset your password"
            : isSignUp
              ? "Create your account"
              : "Welcome back"}
        </h1>
      </header>

      <main className="px-4 py-6">
        <p className="text-sm text-muted-foreground">
          {isReset
            ? recoverySession
              ? "Choose a new password for your Weekndrr account."
              : "Enter your email and we’ll send you a secure reset link."
            : isSignUp
            ? "Save trips and keep your bookings across devices."
            : "Sign in to reach your saved trips and bookings."}
        </p>

        {!requiresPassword && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Demo mode.</strong> No backend is
              configured, so this account lives only on this device and no password
              is stored. Add Supabase keys to enable real accounts.
            </span>
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          {isSignUp && (
            <Field
              id="name"
              label="Full name"
              value={values.name}
              error={errors.name}
              autoComplete="name"
              placeholder="Alex Rivera"
              onChange={(value) => update("name", value)}
            />
          )}

          {!isReset || !recoverySession ? (
            <Field
            id="email"
            label="Email"
            type="email"
            value={values.email}
            error={errors.email}
            autoComplete="email"
            placeholder="alex@example.com"
            onChange={(value) => update("email", value)}
            />
          ) : null}

          {requiresPassword && (!isReset || recoverySession) && (
            <Field
              id="password"
              label={isReset ? "New password" : "Password"}
              type="password"
              value={values.password}
              error={errors.password}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder={isReset || isSignUp ? "At least 8 characters" : "Your password"}
              onChange={(value) => update("password", value)}
            />
          )}

          {formError && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isReset
                  ? recoverySession
                    ? "Updating password…"
                    : "Sending reset link…"
                  : isSignUp
                    ? "Creating account…"
                    : "Signing in…"}
              </>
            ) : isReset ? (
              recoverySession ? "Set new password" : "Send reset link"
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>

          {!isSignUp && !isReset && (
            <Link
              to="/reset-password"
              className="block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isReset ? "Remember your password? " : isSignUp ? "Already have an account? " : "New to Weekndrr? "}
          <Link
            to={isReset || isSignUp ? "/signin" : "/signup"}
            state={{ from: redirectTo }}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {isReset || isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </main>
    </motion.div>
  );
}

function Field({ id, label, error, onChange, ...props }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
