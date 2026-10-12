import { distanceInMiles } from "@/lib/distance";

// Destinations this close to the departure point are the same metro, not a getaway.
const SAME_CITY_MILES = 25;
const MAX_DRIVE_MILES = 300;
const ROAD_FACTOR = 1.2;
const DRIVE_MPH = 60;
const FLIGHT_MPH = 500;
const AIRPORT_OVERHEAD_HOURS = 1;

const roundToHalfHour = (hours) => Math.max(0.5, Math.round(hours * 2) / 2);

export function isSameCity(trip, origin) {
  return distanceInMiles(origin, trip) < SAME_CITY_MILES;
}

/** Recomputes the departure-dependent fields of a trip for the given origin. */
export function tripForOrigin(trip, origin) {
  if (!trip || !origin) return trip;

  const miles = distanceInMiles(origin, trip);
  if (!Number.isFinite(miles)) return trip;

  const isDrivable = miles <= MAX_DRIVE_MILES;
  const flightIsLive = trip.price_sources?.flight === "live";
  const flightPrice = isDrivable
    ? 0
    : flightIsLive
      ? trip.flight_price
      : Math.round(59 + miles * 0.08);

  return {
    ...trip,
    distance_miles: Math.round(miles),
    is_drivable: isDrivable,
    travel_time_hours: roundToHalfHour(
      isDrivable
        ? (miles * ROAD_FACTOR) / DRIVE_MPH
        : AIRPORT_OVERHEAD_HOURS + miles / FLIGHT_MPH
    ),
    flight_price: flightPrice,
    total_price:
      flightPrice + (trip.lodging_price ?? 0) + (trip.car_rental_price ?? 0),
  };
}

export function tripsForOrigin(trips, origin) {
  if (!origin) return trips;
  return trips
    .filter((trip) => !isSameCity(trip, origin))
    .map((trip) => tripForOrigin(trip, origin));
}

export function originKey(origin) {
  if (!origin) return null;
  return `${origin.name}:${origin.latitude.toFixed(2)},${origin.longitude.toFixed(2)}`;
}
