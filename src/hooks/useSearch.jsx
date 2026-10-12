import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getWeekends } from "@/lib/weekends";
import { getCoordinates } from "@/lib/native";
import { cities, nearestCity, resolveOrigin } from "@/api/providers";

const SearchContext = createContext(null);

const FALLBACK_CITY = "Los Angeles";
const STORAGE_KEY = "weekender:departure_city";
const COORDS_KEY = "weekender:departure_coords";
export const DETECTING_LABEL = "Detecting location…";

function readStoredCity() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function readStoredCoords() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COORDS_KEY));
    return Number.isFinite(parsed?.latitude) && Number.isFinite(parsed?.longitude)
      ? { latitude: parsed.latitude, longitude: parsed.longitude }
      : null;
  } catch {
    return null;
  }
}

function storeLocation(city, coords) {
  try {
    window.localStorage.setItem(STORAGE_KEY, city);
    if (coords) window.localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
    else window.localStorage.removeItem(COORDS_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function SearchProvider({ children }) {
  const weekends = useMemo(() => getWeekends(), []);
  const storedCity = useMemo(readStoredCity, []);
  const [departureCity, setDepartureCityState] = useState(
    storedCity ?? DETECTING_LABEL
  );
  const [departureCoords, setDepartureCoords] = useState(() =>
    storedCity ? readStoredCoords() : null
  );
  const [selectedWeekendId, setSelectedWeekendId] = useState(weekends[0].id);
  const [budget, setBudget] = useState(500);
  const [maxDistance, setMaxDistance] = useState(null);
  const [tripTypes, setTripTypes] = useState([]);
  const [lodgingTypes, setLodgingTypes] = useState([]);
  const [maxTravelTime, setMaxTravelTime] = useState(null);
  const locationDetected = useRef(false);

  const setLocation = useCallback((city, coords = null) => {
    setDepartureCityState(city);
    setDepartureCoords(coords);
    storeLocation(city, coords);
  }, []);

  // Picking a city from the list measures distance from that city's centre.
  const setDepartureCity = useCallback((city) => setLocation(city), [setLocation]);

  const detectLocation = useCallback(async () => {
    setDepartureCityState(DETECTING_LABEL);

    const coords = await getCoordinates();
    if (!coords) {
      setLocation(FALLBACK_CITY);
      return;
    }

    let name = null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      if (response.ok) {
        const data = await response.json();
        name =
          data?.address?.city || data?.address?.town || data?.address?.village;
      }
    } catch {
      /* fall back to coordinate matching below */
    }

    // Snap to a city we hold an airport code for, so live pricing works.
    const known = cities.find(
      (city) => city.name.toLowerCase() === (name ?? "").toLowerCase()
    );
    setLocation(
      known?.name ?? nearestCity(coords)?.name ?? name ?? FALLBACK_CITY,
      { latitude: coords.latitude, longitude: coords.longitude }
    );
  }, [setLocation]);

  useEffect(() => {
    // A remembered city means the user lands on their own location instantly.
    if (storedCity || locationDetected.current) return;
    locationDetected.current = true;
    detectLocation();
  }, [storedCity, detectLocation]);

  const selectedWeekend =
    weekends.find((weekend) => weekend.id === selectedWeekendId) ?? weekends[0];

  const isDetectingLocation = departureCity === DETECTING_LABEL;
  const departureOrigin = useMemo(
    () => (isDetectingLocation ? null : resolveOrigin(departureCity, departureCoords)),
    [departureCity, departureCoords, isDetectingLocation]
  );

  const activeFilterCount =
    tripTypes.length + lodgingTypes.length + (maxTravelTime ? 1 : 0) + (maxDistance ? 1 : 0);

  const value = {
    weekends,
    departureCity,
    departureOrigin,
    setDepartureCity,
    detectLocation,
    isDetectingLocation,
    selectedWeekend,
    selectedWeekendId,
    setSelectedWeekendId,
    budget,
    setBudget,
    maxDistance,
    setMaxDistance,
    tripTypes,
    setTripTypes,
    lodgingTypes,
    setLodgingTypes,
    maxTravelTime,
    setMaxTravelTime,
    activeFilterCount,
    clearFilters: () => {
      setTripTypes([]);
      setLodgingTypes([]);
      setMaxTravelTime(null);
      setMaxDistance(null);
    },
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used inside a SearchProvider");
  return context;
}
