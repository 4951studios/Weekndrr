import tripsSeed from "@/data/trips.json";
import cities from "@/data/cities.json";
import { supabase, supabaseEnabled } from "@/api/supabase";
import { tripsForOrigin } from "@/lib/tripOrigin";

export const liveSearchEnabled =
  supabaseEnabled && import.meta.env.VITE_LIVE_PRICING === "true";

const LIVE_PRICE_BATCH_SIZE = 8;
const LIVE_PRICE_LIMIT = 16;

export function findCity(name) {
  return (
    cities.find((city) => city.name.toLowerCase() === (name ?? "").toLowerCase()) ??
    cities.find((city) => city.name === "Los Angeles")
  );
}

/**
 * Departure point used for distance and pricing. Detected coordinates win over the
 * snapped city so the radius is measured from where the user actually is; the
 * nearest known city still supplies the airport code.
 */
export function resolveOrigin(name, coords) {
  const city = cities.find(
    (entry) => entry.name.toLowerCase() === (name ?? "").toLowerCase()
  );
  if (coords) {
    const airport = city ?? nearestCity(coords);
    return {
      name: name ?? airport?.name,
      iata: airport?.iata,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }
  return city ?? null;
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

/** Trip[] for this origin, priced by Supabase Edge Functions when enabled. */
export async function searchTrips({ origin, weekend }) {
  const localTrips = tripsForOrigin(uniqueTrips(tripsSeed), origin);
  if (!liveSearchEnabled || !weekend || !origin?.iata) return localTrips;

  // The pricing function accepts at most 8 trips per request and each trip costs
  // several provider calls, so only the nearest destinations are priced live.
  const nearest = [...localTrips].sort((a, b) => a.distance_miles - b.distance_miles);
  const toPrice = nearest.slice(0, LIVE_PRICE_LIMIT);
  const batches = [];
  for (let i = 0; i < toPrice.length; i += LIVE_PRICE_BATCH_SIZE) {
    batches.push(toPrice.slice(i, i + LIVE_PRICE_BATCH_SIZE));
  }
  const weekendBody = {
    departure: weekend.departure.toISOString(),
    return: weekend.return.toISOString(),
  };

  const priced = await Promise.all(
    batches.map(async (batch) => {
      try {
        const { data, error } = await supabase.functions.invoke("travel-pricing", {
          body: { trips: batch, origin, weekend: weekendBody },
        });
        if (error || !Array.isArray(data?.trips)) throw error ?? new Error("Invalid pricing response");
        return data.trips;
      } catch {
        return batch;
      }
    })
  );

  return uniqueTrips([...priced.flat(), ...nearest.slice(LIVE_PRICE_LIMIT)]);
}
