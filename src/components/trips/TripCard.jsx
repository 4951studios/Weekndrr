import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Car, Heart, Plane, TrendingDown, Sparkles } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { capitalize, formatPrice, formatTravelTime } from "@/utils";
import { cn } from "@/lib/utils";

const BADGES = {
  limited: {
    label: "Limited",
    icon: AlertCircle,
    className: "bg-rose-500 text-white",
  },
  price_drop: {
    label: "Price Drop",
    icon: TrendingDown,
    className: "bg-emerald-500 text-white",
  },
  best_deal: {
    label: "Best Deal",
    icon: Sparkles,
    className: "bg-brand-coral text-white",
  },
};

export default function TripCard({ trip, isSaved, onToggleSave, weekendId }) {
  const badge = BADGES[trip.deal_badge];
  const BadgeIcon = badge?.icon;
  const TravelIcon = trip.is_drivable ? Car : Plane;
  const to = weekendId
    ? `/trip/${trip.id}?weekend=${weekendId}`
    : `/trip/${trip.id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="relative"
    >
      <Link
        to={to}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
          <SafeImage
            src={trip.image_url}
            alt={`${trip.destination}, ${trip.country}`}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-slate-900/10"
          />

          {badge && (
            <span
              className={cn(
                "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow",
                badge.className
              )}
            >
              <BadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {badge.label}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-white drop-shadow">
                {trip.destination}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
                <TravelIcon className="h-4 w-4" aria-hidden="true" />
                {formatTravelTime(trip.travel_time_hours)} •{" "}
                {capitalize(trip.trip_type)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="block text-2xl font-bold text-white drop-shadow">
                {formatPrice(trip.total_price)}
              </span>
              <span className="block text-xs text-white/80">total per person</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 px-1">
          <p className="text-sm font-medium text-slate-900">{trip.lodging_name}</p>
          <p className="text-xs text-muted-foreground">
            ★ {trip.lodging_rating} • {capitalize(trip.lodging_type)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => onToggleSave(trip.id)}
        aria-label={
          isSaved
            ? `Remove ${trip.destination} from saved trips`
            : `Save ${trip.destination}`
        }
        aria-pressed={isSaved}
        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow backdrop-blur transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Heart
          className={cn("h-5 w-5", isSaved ? "text-rose-500" : "text-slate-600")}
          fill={isSaved ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    </motion.article>
  );
}
