import { Check, ExternalLink } from "lucide-react";
import { rememberBookingSite, sitesForTrip } from "@/lib/bookingSites";
import { openExternal } from "@/lib/native";
import { cn } from "@/lib/utils";

/**
 * Lets the traveller choose which site the trip is booked through.
 * `variant="link"` opens the site's search directly instead of selecting it.
 */
export default function BookingSitePicker({
  trip,
  weekend,
  guests = 2,
  value,
  onChange,
  variant = "select",
  product = "lodging",
  origin,
}) {
  const sites = sitesForTrip(trip, product);

  return (
    <ul className="space-y-2" role={variant === "select" ? "radiogroup" : undefined}>
      {sites.map((site) => {
        const isActive = value === site.id;
        const url = site.buildUrl({ trip, weekend, guests, origin, product });

        return (
          <li key={site.id}>
            <button
              type="button"
              role={variant === "select" ? "radio" : undefined}
              aria-checked={variant === "select" ? isActive : undefined}
              onClick={() => {
                rememberBookingSite(trip.id, site.id, product);
                if (variant === "select") onChange(site.id);
                else openExternal(url);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: site.accent }}
              >
                {site.name.charAt(0)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  {site.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {site.tagline}
                </span>
              </span>

              {variant === "select" ? (
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    isActive ? "border-primary bg-primary" : "border-slate-300"
                  )}
                >
                  {isActive && (
                    <Check className="h-3 w-3 text-white" aria-hidden="true" />
                  )}
                </span>
              ) : (
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
