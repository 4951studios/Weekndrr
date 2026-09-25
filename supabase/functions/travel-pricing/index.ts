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

const routeStackBaseUrl = Deno.env.get("ROUTESTACK_BASE_URL") ?? "https://mcp.routestack.ai";
let routeStackToken: { value: string; expiresAt: number } | null = null;
let routeStackRequest: Promise<string> | null = null;

const unwrapRouteStackResult = (data: any) => data?.result?.result ?? data?.result ?? data;

async function getRouteStackToken() {
  const apiKey = Deno.env.get("ROUTESTACK_API_KEY");
  const apiSecret = Deno.env.get("ROUTESTACK_API_SECRET");
  if (!apiKey || !apiSecret) return null;
  if (routeStackToken && Date.now() < routeStackToken.expiresAt) return routeStackToken.value;
  if (routeStackRequest) return routeStackRequest;

  routeStackRequest = (async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID();
    const payload = `${apiKey}:${timestamp}:${nonce}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const hmac = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    try {
      const response = await fetch(`${routeStackBaseUrl}/mcp/auth/partner-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, timestamp, nonce, hmac }),
      });
      if (!response.ok) throw new Error(`RouteStack authentication failed: ${response.status}`);
      const data = await response.json();
      const token = data?.token ?? data?.access_token ?? data?.jwt;
      if (!token) throw new Error("RouteStack authentication returned no token");
      routeStackToken = {
        value: token,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      return token;
    } finally {
      routeStackRequest = null;
    }
  })();

  return routeStackRequest;
}

async function routeStackPost(path: string, body: Record<string, unknown>) {
  const token = await getRouteStackToken();
  if (!token) return null;
  const response = await fetch(`${routeStackBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`RouteStack request failed: ${response.status}`);
  return response.json();
}

function routeStackPrice(entry: any) {
  const candidates = [
    entry?.price,
    entry?.totalPrice,
    entry?.minPrice,
    entry?.publishedRate,
    entry?.price?.total,
    entry?.price?.amount,
    entry?.rates?.[0]?.price?.total,
    entry?.rooms?.[0]?.rates?.[0]?.price?.total,
  ];
  const price = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0);
  return price ? Math.round(price) : null;
}

async function routeStackHotelOffer({ destination, latitude, longitude, checkIn, checkOut }: Record<string, string>) {
  const destinationData = await routeStackPost("/mcp/hotel/search-destinations", {
    type: "DESTINATION",
    query: destination,
  });
  const destinations = unwrapRouteStackResult(destinationData);
  const match = Array.isArray(destinations) ? destinations[0] : destinations;
  const destinationId = match?.destinationId ?? match?.id;
  if (!destinationId) return null;

  const searchData = await routeStackPost("/mcp/hotel/search-hotels", {
    destinationType: "DESTINATION",
    destinationId,
    lat: Number(latitude),
    long: Number(longitude),
    checkIn: dateOnly(checkIn),
    checkOut: dateOnly(checkOut),
    roomCount: 1,
    rooms: [{ adults: 2, children: 0, infants: 0 }],
    currency: "USD",
    limit: 20,
  });
  const hotels = unwrapRouteStackResult(searchData);
  const offers = (Array.isArray(hotels) ? hotels : []).map((entry: any) => ({
    price: routeStackPrice(entry),
    name: entry?.name ?? entry?.hotelName ?? entry?.property?.name,
    rating: Number(entry?.rating ?? entry?.starRating ?? entry?.property?.rating) || null,
  })).filter((entry: any) => entry.price);
  if (!offers.length) return null;
  return offers.reduce((cheapest: any, entry: any) =>
    entry.price < cheapest.price ? entry : cheapest
  );
}

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

async function liveHotelOffer({ cityCode, destination, latitude, longitude, checkIn, checkOut }: Record<string, string>) {
  if (Deno.env.get("ROUTESTACK_API_KEY") && Deno.env.get("ROUTESTACK_API_SECRET")) {
    try {
      const routeStackOffer = await routeStackHotelOffer({
        destination,
        latitude,
        longitude,
        checkIn,
        checkOut,
      });
      if (routeStackOffer) return routeStackOffer;
    } catch {
      // Fall through to the existing provider when RouteStack is unavailable.
    }
  }
  return hotelOffer({ cityCode, checkIn, checkOut });
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
    liveHotelOffer({
      cityCode: trip.city_code,
      destination: trip.destination,
      latitude: String(trip.latitude),
      longitude: String(trip.longitude),
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
