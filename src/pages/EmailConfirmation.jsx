import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleAlert, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/api/supabase";
import { Button } from "@/components/ui/button";

export default function EmailConfirmation() {
  const location = useLocation();
  const [result, setResult] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setResult("unavailable");
      return;
    }

    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const error =
      query.get("error_description") ??
      hash.get("error_description") ??
      query.get("error") ??
      hash.get("error");
    if (error) {
      setErrorMessage(error);
      setResult("invalid");
      return;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setErrorMessage(sessionError.message);
          setResult("invalid");
        } else {
          setResult(data.session ? "confirmed" : "invalid");
        }
      })
      .catch((sessionError) => {
        if (!active) return;
        setErrorMessage(sessionError.message);
        setResult("invalid");
      });

    return () => {
      active = false;
    };
  }, [location.hash, location.search]);

  if (result === "verifying") {
    return (
      <main className="px-6 py-20 text-center">
        <Loader2
          className="mx-auto h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Confirming your email…
        </p>
      </main>
    );
  }

  const confirmed = result === "confirmed";
  const unavailable = result === "unavailable";

  return (
    <main className="px-6 py-20 text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          confirmed ? "bg-emerald-100" : "bg-rose-100"
        }`}
      >
        {confirmed ? (
          <MailCheck
            className="h-8 w-8 text-emerald-600"
            aria-hidden="true"
          />
        ) : (
          <CircleAlert
            className="h-8 w-8 text-rose-600"
            aria-hidden="true"
          />
        )}
      </div>
      <h1 className="mt-5 text-xl font-bold text-slate-900">
        {confirmed
          ? "Email confirmed"
          : unavailable
            ? "Confirmation unavailable"
            : "Confirmation link invalid"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {confirmed
          ? "Your account is ready. Sign in to continue."
          : unavailable
            ? "Account confirmation requires a connected service."
            : errorMessage ||
              "This confirmation link is invalid or has already been used. Request a new one to continue."}
      </p>
      <Button asChild size="lg" className="mt-6">
        <Link to={confirmed ? "/signin" : "/signup"}>
          {confirmed ? "Sign in" : "Create account"}
        </Link>
      </Button>
    </main>
  );
}
