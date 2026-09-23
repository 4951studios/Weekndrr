import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Car,
  Check,
  Clock,
  Heart,
  MapPin,
  Plane,
  Share2,
  Shield,
} from "lucide-react";
import { useSavedTrips, useTrip } from "@/hooks/useEntities";
import { useSearch } from "@/hooks/useSearch";
import { findWeekendById } from "@/lib/weekends";
import { shareLink, openExternal } from "@/lib/native";
import LodgingGallery from "@/components/trips/LodgingGallery";
import PriceBreakdown from "@/components/trips/PriceBreakdown";
import BookingSitePicker from "@/components/booking/BookingSitePicker";
import { carSearchUrl } from "@/lib/bookingSites";
import { findCity } from "@/api/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CANCELLATION_LABELS, capitalize, formatPrice } from "@/utils";
import { cn } from "@/lib/utils";

const CANCELLATION_STYLES = {
  free: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  "non-refundable": "bg-rose-50 text-rose-700",
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: trip, isLoading } = useTrip(id);
  const { isSaved, toggleSaved } = useSavedTrips();
  const { selectedWeekend, departureCity } = useSearch();
  const [copied, setCopied] = useState(false);

  const weekend = searchParams.get("weekend")
    ? findWeekendById(searchParams.get("weekend"))
    : selectedWeekend;

  const handleShare = async () => {
    const result = await shareLink({
      title: trip?.destination,
      url: window.location.href,
    });
    if (result === "copied") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="h-8 w-1/2 rounded-md" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">This trip is no longer available.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const TravelIcon = trip.is_drivable ? Car : Plane;
  const saved = isSaved(trip.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="pb-28"
    >
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-3 py-2.5 backdrop-blur-xl pt-safe">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleSaved(trip.id)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved trips" : "Save this trip"}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart
              className={cn("h-5 w-5", saved ? "text-rose-500" : "text-slate-700")}
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this trip"
            className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Share2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <LodgingGallery photos={trip.lodging_photos} alt={trip.lodging_name} />

      <div className="space-y-6 px-4 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{trip.destination}</h1>
            <p className="text-sm text-muted-foreground">
              {trip.landmark ? `${trip.landmark} · ${trip.country}` : trip.country}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-2xl font-bold text-primary">
              {formatPrice(trip.total_price)}
            </span>
            <span className="block text-xs text-muted-foreground">per person</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <TravelIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            {trip.travel_time_hours}h {trip.is_drivable ? "drive" : "flight"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            {weekend.range}
          </span>
        </div>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">{trip.lodging_name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ★ {trip.lodging_rating} • {capitalize(trip.lodging_type)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                CANCELLATION_STYLES[trip.cancellation_policy]
              )}
            >
              {CANCELLATION_LABELS[trip.cancellation_policy]}
            </span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {trip.amenities.map((amenity) => (
              <li
                key={amenity}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {amenity}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Price details</h2>
          <PriceBreakdown trip={trip} />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-brand-emerald" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-slate-700">Secure booking</strong> —
              your payment is protected.
            </span>
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Where to book</h2>
            <p className="text-xs text-muted-foreground">
              Compare the same weekend on the sites you already trust.
            </p>
          </div>

          <BookingSitePicker
            trip={trip}
            weekend={weekend}
            variant="link"
          />

          {!trip.is_drivable && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Compare flights</h3>
              <BookingSitePicker
                trip={trip}
                weekend={weekend}
                product="flight"
                origin={findCity(departureCity)}
                variant="link"
              />
            </div>
          )}
          {trip.is_drivable && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => openExternal(carSearchUrl({ trip, weekend }))}
              >
                <Car className="h-4 w-4" aria-hidden="true" />
                Rental cars
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-nav-safe z-30 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-lg items-center gap-4 px-4 py-3">
          <div className="shrink-0">
            <span className="block text-lg font-bold text-slate-900">
              {formatPrice(trip.total_price)}
            </span>
            <span className="block text-xs text-muted-foreground">per person</span>
          </div>
          <Button asChild size="lg" className="flex-1">
            <Link to={`/checkout?trip=${trip.id}&weekend=${weekend.id}`}>Book now</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
