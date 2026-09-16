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
    supports: ["hotel", "rental"],
    buildUrl: ({ trip, weekend, guests }) =>
      `https://www.expedia.com/Hotel-Search?destination=${enc(
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
    supports: ["hotel", "rental"],
    buildUrl: ({ trip, weekend, guests }) =>
      `https://www.kayak.com/hotels/${enc(trip.destination)}/${day(
        weekend.departure
      )}/${day(weekend.return)}/${guests}adults`,
  },
];

export function sitesForTrip(trip) {
  return BOOKING_SITES.filter((site) => site.supports.includes(trip.lodging_type));
}

export function getBookingSite(id) {
  return BOOKING_SITES.find((site) => site.id === id) ?? null;
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
