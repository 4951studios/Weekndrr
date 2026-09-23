import tripsSeed from "@/data/trips.json";
import cities from "@/data/cities.json";
import { supabase, supabaseEnabled } from "@/api/supabase";

export const liveSearchEnabled =
  supabaseEnabled && import.meta.env.VITE_LIVE_PRICING === "true";

export function findCity(name) {
  return (
    cities.find((city) => city.name.toLowerCase() === (name ?? "").toLowerCase()) ??
    cities.find((city) => city.name === "Los Angeles")
  );
}

/** Closest departure city to a coordinate, so detected locations map to an airport. */
export function nearestCity({ latitude, longitude }) {
  let closest = null;
  let smallest = Infinity;

  for (const city of cities) {
    const dLat = ((city.latitude - latitude) * Math.PI) / 180;
    const dLon = ((city.longitude - longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((city.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (km < smallest) {
      smallest = km;
      closest = city;
    }
  }

  return closest;
}

export { cities };

export function uniqueTrips(trips) {
  return Array.from(
    new Map(
      trips
        .filter((trip) => trip?.id)
        .map((trip) => [trip.id, trip])
    ).values()
  );
}

/** Trip[] priced by Supabase Edge Functions when enabled, otherwise the seed. */
export async function searchTrips({ departureCity, weekend }) {
  if (!liveSearchEnabled || !weekend) return uniqueTrips(tripsSeed);

  const origin = findCity(departureCity);
  try {
    const { data, error } = await supabase.functions.invoke("travel-pricing", {
      body: {
        trips: tripsSeed,
        origin,
        weekend: {
          departure: weekend.departure.toISOString(),
          return: weekend.return.toISOString(),
        },
      },
    });
    if (error || !Array.isArray(data?.trips)) throw error ?? new Error("Invalid pricing response");
    return uniqueTrips(data.trips);
  } catch {
    return uniqueTrips(tripsSeed);
  }
}
