import { addDays, format, nextFriday, startOfDay } from "date-fns";

/** The next 4 Fri–Sun weekends, starting with the upcoming one. */
export function getWeekends(count = 4) {
  const today = startOfDay(new Date());
  const firstFriday =
    today.getDay() === 5 ? today : nextFriday(today);

  return Array.from({ length: count }, (_, index) => {
    const departure = addDays(firstFriday, index * 7);
    const returnDate = addDays(departure, 2);
    let label;
    if (index === 0) label = "This Weekend";
    else if (index === 1) label = "Next Weekend";
    else label = format(departure, "MMM d");

    return {
      id: format(departure, "yyyy-MM-dd"),
      label,
      departure,
      return: returnDate,
      range: formatDateRange(departure, returnDate),
    };
  });
}

export function formatDateRange(departure, returnDate) {
  const start = departure instanceof Date ? departure : new Date(departure);
  const end = returnDate instanceof Date ? returnDate : new Date(returnDate);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function findWeekendById(id) {
  const weekends = getWeekends();
  return weekends.find((weekend) => weekend.id === id) ?? weekends[0];
}
