import { format } from "date-fns";

/**
 * Real public search URLs — Weekndrr hands the traveller off to the site they
 * pick rather than taking payment for the supplier.
 */

const day = (date) => format(date, "yyyy-MM-dd");
const enc = encodeURIComponent;

export const BOOKING_SITES = [
  {
    id: "booking",
    name: "Booking.com",
    tagline: "Hotels & rentals",
    accent: "#003580",
    supports: ["hotel", "rental"],
    buildUrl: ({ trip, weekend, guests }) =>
      `https://www.booking.com/searchresults.html?ss=${enc(
        `${trip.destination}, ${trip.country}`
      )}&checkin=${day(weekend.departure)}&checkout=${day(
        weekend.return
      )}&group_adults=${guests}`,
  },
  {
    id: "expedia",
    name: "Expedia",
    tagline: "Bundle flight + hotel",
    accent: "#FFC94D",
    supports: ["hotel", "rental", "flight"],
    buildUrl: ({ trip, weekend, guests, origin, product = "lodging" }) =>
      product === "flight"
        ? `https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${origin.iata},to:${trip.iata_code},departure:${day(weekend.departure)}TANYT&leg2=from:${trip.iata_code},to:${origin.iata},departure:${day(weekend.return)}TANYT&passengers=adults:${guests}`
        : `https://www.expedia.com/Hotel-Search?destination=${enc(
            trip.destination
          )}&startDate=${day(weekend.departure)}&endDate=${day(
            weekend.return
          )}&adults=${guests}`,
  },
  {
    id: "airbnb",
    name: "Airbnb",
    tagline: "Homes & unique stays",
    accent: "#FF5A5F",
    supports: ["rental"],
    buildUrl: ({ trip, weekend, guests }) =>
      `https://www.airbnb.com/s/${enc(
        `${trip.destination}--${trip.country}`
      )}/homes?checkin=${day(weekend.departure)}&checkout=${day(
        weekend.return
      )}&adults=${guests}`,
  },
  {
    id: "hotels",
    name: "Hotels.com",
    tagline: "Collect reward nights",
    accent: "#D32F2F",
    supports: ["hotel"],
    buildUrl: ({ trip, weekend, guests }) =>
      `https://www.hotels.com/Hotel-Search?destination=${enc(
        trip.destination
      )}&startDate=${day(weekend.departure)}&endDate=${day(
        weekend.return
      )}&adults=${guests}`,
  },
  {
    id: "kayak",
    name: "Kayak",
    tagline: "Compare every site",
    accent: "#FF690F",
    supports: ["hotel", "rental", "flight"],
    buildUrl: ({ trip, weekend, guests, origin, product = "lodging" }) =>
      product === "flight"
        ? flightSearchUrl({ trip, origin, weekend })
        : `https://www.kayak.com/hotels/${enc(trip.destination)}/${day(
            weekend.departure
          )}/${day(weekend.return)}/${guests}adults`,
  },
];

export function sitesForTrip(trip, product = "lodging") {
  const category = product === "flight" ? "flight" : trip.lodging_type;
  return BOOKING_SITES.filter((site) => site.supports.includes(category));
}

export function getBookingSite(id) {
  return BOOKING_SITES.find((site) => site.id === id) ?? null;
}

const LAST_SITE_PREFIX = "weekender:last-booking-site:";

export function rememberBookingSite(tripId, siteId, product = "lodging") {
  if (!tripId || !siteId) return;
  try {
    window.localStorage.setItem(`${LAST_SITE_PREFIX}${product}:${tripId}`, siteId);
    if (product === "lodging") {
      window.localStorage.setItem(`${LAST_SITE_PREFIX}${tripId}`, siteId);
    }
  } catch {
    /* storage unavailable */
  }
}

export function getRememberedBookingSite(tripId, product = "lodging") {
  if (!tripId) return null;
  try {
    return (
      window.localStorage.getItem(`${LAST_SITE_PREFIX}${product}:${tripId}`) ??
      (product === "lodging"
        ? window.localStorage.getItem(`${LAST_SITE_PREFIX}${tripId}`)
        : null)
    );
  } catch {
    return null;
  }
}

/** Flight and car deep links shown alongside the lodging handoff. */
export function flightSearchUrl({ trip, origin, weekend }) {
  return `https://www.kayak.com/flights/${origin.iata}-${trip.iata_code}/${day(
    weekend.departure
  )}/${day(weekend.return)}`;
}

export function carSearchUrl({ trip, weekend }) {
  return `https://www.kayak.com/cars/${enc(trip.destination)}/${day(
    weekend.departure
  )}/${day(weekend.return)}`;
}
