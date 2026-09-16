import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const dateOnly = (value: string) => value.slice(0, 10);

let amadeusToken: { value: string; expiresAt: number } | null = null;
let amadeusRequest: Promise<string> | null = null;

async function getAmadeusToken() {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  if (amadeusToken && Date.now() < amadeusToken.expiresAt) return amadeusToken.value;
  if (amadeusRequest) return amadeusRequest;

  amadeusRequest = (async () => {
    try {
      const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (!response.ok) throw new Error("Amadeus authentication failed");
      const data = await response.json();
      amadeusToken = {
        value: data.access_token,
        expiresAt: Date.now() + (Number(data.expires_in ?? 1799) * 1000) - 60_000,
      };
      return amadeusToken.value;
    } finally {
      amadeusRequest = null;
    }
  })();

  return amadeusRequest;
}

async function amadeusGet(path: string, params: Record<string, string>) {
  const token = await getAmadeusToken();
  if (!token) return null;
  const url = new URL(`https://test.api.amadeus.com${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Amadeus request failed: ${response.status}`);
  return response.json();
}

async function flightPrice({ origin, destination, departure, returnDate }: Record<string, string>) {
  const data = await amadeusGet("/v2/shopping/flight-offers", {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: dateOnly(departure),
    returnDate: dateOnly(returnDate),
    adults: "1",
    currencyCode: "USD",
    max: "5",
  });
  const prices = (data?.data ?? [])
    .map((offer: any) => Number(offer?.price?.grandTotal ?? offer?.price?.total))
    .filter((price: number) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.round(Math.min(...prices)) : null;
}

async function hotelOffer({ cityCode, checkIn, checkOut }: Record<string, string>) {
  const list = await amadeusGet("/v1/reference-data/locations/hotels/by-city", {
    cityCode,
    radius: "20",
    radiusUnit: "KM",
    hotelSource: "ALL",
  });
  const hotelIds = (list?.data ?? [])
    .map((hotel: any) => hotel.hotelId)
    .filter(Boolean)
    .slice(0, 20);
  if (!hotelIds.length) return null;

  const offers = await amadeusGet("/v3/shopping/hotel-offers", {
    hotelIds: hotelIds.join(","),
    checkInDate: dateOnly(checkIn),
    checkOutDate: dateOnly(checkOut),
    adults: "2",
    currency: "USD",
    bestRateOnly: "true",
  });
  const candidates = (offers?.data ?? [])
    .map((entry: any) => {
      const price = Number(entry?.offers?.[0]?.price?.total);
      if (!Number.isFinite(price) || price <= 0) return null;
      return {
        price: Math.round(price),
        name: entry?.hotel?.name,
        rating: Number(entry?.hotel?.rating) || null,
        cancellation: entry?.offers?.[0]?.policies?.cancellations?.length
          ? "partial"
          : "non-refundable",
      };
    })
    .filter(Boolean);
  return candidates.length
    ? candidates.reduce((cheapest: any, entry: any) =>
        entry.price < cheapest.price ? entry : cheapest
      )
    : null;
}

async function carOffer({ latitude, longitude, pickUp, dropOff }: Record<string, string>) {
  const key = Deno.env.get("RAPIDAPI_KEY");
  if (!key) return null;
  const url = new URL("https://booking-com15.p.rapidapi.com/api/v1/cars/searchCarRentals");
  Object.entries({
    pick_up_latitude: latitude,
    pick_up_longitude: longitude,
    drop_off_latitude: latitude,
    drop_off_longitude: longitude,
    pick_up_date: dateOnly(pickUp),
    drop_off_date: dateOnly(dropOff),
    pick_up_time: "10:00",
    drop_off_time: "18:00",
    currency_code: "USD",
  }).forEach(([name, value]) => url.searchParams.set(name, value));

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "booking-com15.p.rapidapi.com",
    },
  });
  if (!response.ok) throw new Error(`RapidAPI request failed: ${response.status}`);
  const data = await response.json();
  const offers = data?.data?.search_results ?? [];
  const priced = offers
    .map((offer: any) => ({
      price: Number(offer?.pricing_info?.drive_away_price ?? offer?.pricing_info?.price),
      vehicle: offer?.vehicle_info?.v_name ?? "Rental car",
      supplier: offer?.supplier_info?.name ?? "Booking.com",
    }))
    .filter((offer: any) => Number.isFinite(offer.price) && offer.price > 0);
  return priced.length ? priced.reduce((a: any, b: any) => (a.price < b.price ? a : b)) : null;
}

async function priceTrip(trip: any, origin: any, weekend: any) {
  const result = {
    ...trip,
    price_source: trip.price_source ?? "demo",
    price_sources: {
      flight: "demo",
      lodging: "demo",
      car: trip.is_drivable ? "demo" : "not_applicable",
    },
  };

  const tasks: Promise<void>[] = [
    hotelOffer({
      cityCode: trip.city_code,
      checkIn: weekend.departure,
      checkOut: weekend.return,
    })
      .then((offer) => {
        if (!offer) return;
        result.lodging_price = offer.price;
        result.lodging_name = offer.name || trip.lodging_name;
        result.lodging_rating = offer.rating ?? trip.lodging_rating;
        result.cancellation_policy = offer.cancellation ?? trip.cancellation_policy;
        result.price_sources.lodging = "live";
      })
      .catch(() => {}),
  ];

  if (!trip.is_drivable && origin.iata !== trip.iata_code) {
    tasks.push(
      flightPrice({
        origin: origin.iata,
        destination: trip.iata_code,
        departure: weekend.departure,
        returnDate: weekend.return,
      })
        .then((price) => {
          if (price) {
            result.flight_price = price;
            result.price_sources.flight = "live";
          }
        })
        .catch(() => {})
    );
  }

  if (trip.is_drivable) {
    tasks.push(
      carOffer({
        latitude: String(trip.latitude),
        longitude: String(trip.longitude),
        pickUp: weekend.departure,
        dropOff: weekend.return,
      })
        .then((car) => {
          if (car) {
            result.car_rental_price = Math.round(car.price);
            result.car_rental_name = `${car.vehicle} · ${car.supplier}`;
            result.price_sources.car = "live";
          }
        })
        .catch(() => {})
    );
  }

  await Promise.all(tasks);
  const sources = Object.values(result.price_sources);
  result.price_source = sources.every((source) => source === "live")
    ? "live"
    : sources.some((source) => source === "live")
      ? "mixed"
      : "demo";
  result.priced_at = new Date().toISOString();
  result.total_price =
    (result.flight_price ?? 0) +
    (result.lodging_price ?? 0) +
    (result.car_rental_price ?? 0);
  return result;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const { trips, origin, weekend } = await request.json();
    if (!Array.isArray(trips) || trips.length > 8 || !origin?.iata || !weekend?.departure) {
      return json({ error: "Invalid pricing request" }, 400);
    }

    const priced = await Promise.all(
      trips.map((trip: any) => priceTrip(trip, origin, weekend))
    );
    return json({ trips: priced.sort((a, b) => a.total_price - b.total_price) });
  } catch (error) {
    console.error(error);
    return json({ error: "Live pricing is temporarily unavailable" }, 502);
  }
});
