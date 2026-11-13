import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, Check, ExternalLink } from "lucide-react";
import { useBooking, useTrip, useUpdateBooking } from "@/hooks/useEntities";
import { useSearch } from "@/hooks/useSearch";
import { getBookingSite } from "@/lib/bookingSites";
import { resolveOrigin } from "@/api/providers";
import { useToast } from "@/components/ui/toast";
import { openExternal } from "@/lib/native";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateRange } from "@/lib/weekends";
import { formatPrice } from "@/utils";

export default function Confirmation() {
  const { bookingId } = useParams();
  const { data: booking, isLoading } = useBooking(bookingId);
  const { departureOrigin } = useSearch();
  const bookingOrigin = resolveOrigin(booking?.departure_city) ?? departureOrigin;
  const { data: trip } = useTrip(booking?.trip_id, bookingOrigin);

  const updateBooking = useUpdateBooking();
  const toast = useToast();

  const setStatus = (status, message) =>
    updateBooking.mutate(
      { id: bookingId, values: { status } },
      {
        onSuccess: () => toast.show(message),
        onError: () => toast.show("Couldn’t update this trip. Try again.", { tone: "error" }),
      }
    );

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">We couldn’t find that booking.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const dates = formatDateRange(
    booking.travel_dates.departure,
    booking.travel_dates.return
  );
  const site = getBookingSite(booking.booking_site);
  const flightSite = getBookingSite(booking.flight_site);
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="px-5 py-10 text-center"
    >
      <div
        className={
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full " +
          (isPending ? "bg-amber-100" : "bg-emerald-100")
        }
      >
        {isPending ? (
          <Bookmark className="h-8 w-8 text-amber-600" aria-hidden="true" />
        ) : (
          <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        )}
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        {isPending
          ? `Your ${trip?.destination ?? "getaway"} plan is saved`
          : isCancelled
            ? "This plan was cancelled"
            : `Your ${trip?.destination ?? "getaway"} trip is booked`}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isPending
          ? `Not booked yet. Finish the reservation on ${site?.name ?? "the booking site"} to lock it in. You can come back to this plan anytime from your profile.`
          : isCancelled
            ? "You can start a new plan from the trip page."
            : `Details were saved for ${booking.guest_info?.email}.`}
      </p>

      <span className="mt-5 inline-block rounded-full bg-slate-900 px-5 py-2 font-mono text-base font-semibold tracking-[0.2em] text-white">
        {booking.confirmation_code}
      </span>

      <dl className="mt-8 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">Dates</dt>
          <dd className="font-medium text-slate-900">{dates}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Lodging</dt>
          <dd className="truncate font-medium text-slate-900">
            {trip?.lodging_name ?? "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">Guests</dt>
          <dd className="font-medium text-slate-900">{booking.guests}</dd>
        </div>
        {site && (
          <div className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">Next step</dt>
            <dd className="font-medium text-slate-900">{site.name}</dd>
          </div>
        )}
        {flightSite && trip && !trip.is_drivable && (
          <div className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">Flights</dt>
            <dd className="font-medium text-slate-900">{flightSite.name}</dd>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">Estimated total</dt>
          <dd className="font-bold text-primary">
            {formatPrice((trip?.total_price ?? 0) * booking.guests)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 space-y-3">
        {site && trip && (
          <Button
            type="button"
            size="lg"
            variant="coral"
            className="w-full"
            onClick={() =>
              openExternal(
                site.buildUrl({
                  trip,
                  weekend: {
                    departure: new Date(booking.travel_dates.departure),
                    return: new Date(booking.travel_dates.return),
                  },
                  guests: booking.guests,
                })
              )
            }
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Continue on {site.name}
          </Button>
        )}
        {flightSite && trip && !trip.is_drivable && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() =>
              openExternal(
                flightSite.buildUrl({
                  trip,
                  origin: bookingOrigin,
                  weekend: {
                    departure: new Date(booking.travel_dates.departure),
                    return: new Date(booking.travel_dates.return),
                  },
                  guests: booking.guests,
                  product: "flight",
                })
              )
            }
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Compare flights on {flightSite.name}
          </Button>
        )}
        {isPending && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            disabled={updateBooking.isPending}
            onClick={() => setStatus("confirmed", "Marked as booked")}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            I’ve finished booking
          </Button>
        )}
        {trip && (
          <Button asChild size="lg" className="w-full">
            <Link to={`/trip/${trip.id}`}>View trip</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/">Back to Explore</Link>
        </Button>
        {isPending && (
          <button
            type="button"
            onClick={() => setStatus("cancelled", "Plan cancelled")}
            className="text-sm font-medium text-slate-500 underline underline-offset-2"
          >
            Cancel this plan
          </button>
        )}
      </div>
    </motion.div>
  );
}
