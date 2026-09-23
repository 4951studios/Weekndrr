import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { entities } from "@/api/client";
import { useTrip } from "@/hooks/useEntities";
import { useSearch } from "@/hooks/useSearch";
import { findWeekendById } from "@/lib/weekends";
import SafeImage from "@/components/SafeImage";
import GuestForm from "@/components/checkout/GuestForm";
import BookingSitePicker from "@/components/booking/BookingSitePicker";
import { getBookingSite, getRememberedBookingSite, sitesForTrip } from "@/lib/bookingSites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, generateConfirmationCode } from "@/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedWeekend, departureCity } = useSearch();

  const tripId = searchParams.get("trip");
  const { data: trip, isLoading } = useTrip(tripId);
  const weekend = searchParams.get("weekend")
    ? findWeekendById(searchParams.get("weekend"))
    : selectedWeekend;

  const [guests, setGuests] = useState(2);
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState(null);
  const [bookingSiteId, setBookingSiteId] = useState(null);

  const defaultSiteId = trip
    ? sitesForTrip(trip).some((site) => site.id === getRememberedBookingSite(trip.id))
      ? getRememberedBookingSite(trip.id)
      : sitesForTrip(trip)[0]?.id
    : null;
  const selectedSiteId = bookingSiteId ?? defaultSiteId;

  const total = (trip?.total_price ?? 0) * guests;

  const validate = () => {
    const next = {};
    if (!guest.name.trim()) next.name = "Name is required.";
    if (!guest.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(guest.email)) next.email = "Enter a valid email.";
    if (!guest.phone.trim()) next.phone = "Phone is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    if (!trip || !validate()) return;
    setProcessing(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const booking = await entities.Booking.create({
        trip_id: trip.id,
        departure_city: departureCity,
        travel_dates: {
          departure: weekend.departure.toISOString(),
          return: weekend.return.toISOString(),
        },
        guests,
        guest_info: { ...guest },
        total_paid: 0,
        status: "pending",
        booking_site: selectedSiteId,
        confirmation_code: generateConfirmationCode(),
      });

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate(`/confirmation/${booking.id}`, { replace: true });
    } catch (error) {
      setFormError(error.message ?? "We couldn’t save your trip plan.");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">We couldn’t find that trip.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-8">
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
          Complete your booking
        </h1>
      </header>

      <form
        className="space-y-7 px-4 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        <section className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
            <SafeImage
              src={trip.image_url}
              alt={trip.destination}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{trip.destination}</p>
            <p className="text-xs text-muted-foreground">{weekend.range}</p>
            <p className="text-xs text-muted-foreground">{trip.lodging_name}</p>
          </div>
          <span className="shrink-0 font-bold text-primary">
            {formatPrice(total)}
          </span>
        </section>

        <section className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">Guests</p>
            <p className="text-xs text-muted-foreground">
              {formatPrice(trip.total_price)} per person
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Remove a guest"
              disabled={guests <= 1}
              onClick={() => setGuests((n) => Math.max(1, n - 1))}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-6 text-center text-base font-semibold" aria-live="polite">
              {guests}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Add a guest"
              disabled={guests >= 8}
              onClick={() => setGuests((n) => Math.min(8, n + 1))}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <GuestForm
          values={guest}
          errors={errors}
          onChange={(name, value) =>
            setGuest((current) => ({ ...current, [name]: value }))
          }
        />

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Book through</h2>
            <p className="text-xs text-muted-foreground">
              Your reservation is completed on the site you choose.
            </p>
          </div>
          <BookingSitePicker
            trip={trip}
            weekend={weekend}
            guests={guests}
            value={selectedSiteId}
            onChange={setBookingSiteId}
          />
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Trip summary</h2>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>
              {formatPrice(trip.total_price)} × {guests} guest
              {guests === 1 ? "" : "s"}
            </span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="my-3 h-px bg-slate-200" />
          <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">
            Weekndrr does not charge you. You’ll complete the reservation on the
            booking site you choose.
          </div>
        </section>

        {formError && (
          <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <p>{formError}</p>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="mt-2 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving trip plan…
            </>
          ) : (
            `Continue to ${sitesForTrip(trip).find((site) => site.id === selectedSiteId)?.name ?? "booking site"}`
          )}
        </Button>
      </form>
    </div>
  );
}
