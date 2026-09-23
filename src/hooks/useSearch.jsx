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
import { cities, nearestCity } from "@/api/providers";

const SearchContext = createContext(null);

const FALLBACK_CITY = "Los Angeles";
const STORAGE_KEY = "weekender:departure_city";
export const DETECTING_LABEL = "Detecting location…";

function readStoredCity() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function storeCity(city) {
  try {
    window.localStorage.setItem(STORAGE_KEY, city);
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
  const [selectedWeekendId, setSelectedWeekendId] = useState(weekends[0].id);
  const [budget, setBudget] = useState(500);
  const [maxDistance, setMaxDistance] = useState(null);
  const [tripTypes, setTripTypes] = useState([]);
  const [lodgingTypes, setLodgingTypes] = useState([]);
  const [maxTravelTime, setMaxTravelTime] = useState(null);
  const locationDetected = useRef(false);

  const setDepartureCity = (city) => {
    setDepartureCityState(city);
    storeCity(city);
  };

  const detectLocation = useCallback(async () => {
    setDepartureCityState(DETECTING_LABEL);

    const coords = await getCoordinates();
    if (!coords) {
      setDepartureCity(FALLBACK_CITY);
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
    setDepartureCity(
      known?.name ?? nearestCity(coords)?.name ?? name ?? FALLBACK_CITY
    );
  }, []);

  useEffect(() => {
    // A remembered city means the user lands on their own location instantly.
    if (storedCity || locationDetected.current) return;
    locationDetected.current = true;
    detectLocation();
  }, [storedCity, detectLocation]);

  const selectedWeekend =
    weekends.find((weekend) => weekend.id === selectedWeekendId) ?? weekends[0];

  const activeFilterCount =
    tripTypes.length + lodgingTypes.length + (maxTravelTime ? 1 : 0) + (maxDistance ? 1 : 0);

  const value = {
    weekends,
    departureCity,
    setDepartureCity,
    detectLocation,
    isDetectingLocation: departureCity === DETECTING_LABEL,
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
