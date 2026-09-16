import { formatPrice } from "@/utils";

export default function PriceBreakdown({ trip }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 py-1.5">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {trip.is_drivable ? "Drive there" : "Round-trip flight"}
          </p>
          <p className="text-xs text-muted-foreground">
            {trip.is_drivable
              ? `${trip.travel_time_hours}h each way`
              : `${trip.travel_time_hours}h each way`}
          </p>
        </div>
        {trip.is_drivable ? (
          <span className="text-sm font-semibold text-brand-emerald">Included</span>
        ) : (
          <span className="text-sm font-semibold text-slate-900">
            {formatPrice(trip.flight_price)}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 py-1.5">
        <div>
          <p className="text-sm font-medium text-slate-900">{trip.lodging_name}</p>
          <p className="text-xs text-muted-foreground">2 nights</p>
        </div>
        <span className="text-sm font-semibold text-slate-900">
          {formatPrice(trip.lodging_price)}
        </span>
      </div>

      {trip.car_rental_price > 0 && (
        <div className="flex items-start justify-between gap-4 py-1.5">
          <div>
            <p className="text-sm font-medium text-slate-900">Rental car</p>
            <p className="text-xs text-muted-foreground">
              {trip.car_rental_name ?? "2 days"}
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {formatPrice(trip.car_rental_price)}
          </span>
        </div>
      )}

      <div className="my-3 h-px bg-slate-200" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Total per person</span>
        <span className="text-xl font-bold text-primary">
          {formatPrice(trip.total_price)}
        </span>
      </div>
    </div>
  );
}
