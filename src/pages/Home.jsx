import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Radio, RefreshCw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useSavedTrips, useTrips } from "@/hooks/useEntities";
import { findCity, liveSearchEnabled } from "@/api/providers";
import { cn } from "@/lib/utils";
import LocationPicker from "@/components/search/LocationPicker";
import WeekendPicker from "@/components/search/WeekendPicker";
import BudgetSlider from "@/components/search/BudgetSlider";
import DistanceSlider from "@/components/search/DistanceSlider";
import FilterChips from "@/components/search/FilterChips";
import TripsList from "@/components/trips/TripsList";
import TripCard from "@/components/trips/TripCard";
import { Button } from "@/components/ui/button";
import { shuffle } from "@/utils";
import { distanceInMiles } from "@/lib/distance";

export default function Home() {
  const {
    weekends,
    departureCity,
    setDepartureCity,
    detectLocation,
    isDetectingLocation,
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
    clearFilters,
    selectedWeekend,
  } = useSearch();

  const { data: trips = [], isLoading, isFetching } = useTrips({
    departureCity,
    weekend: selectedWeekend,
  });
  const { isSaved, toggleSaved } = useSavedTrips();

  const [locationOpen, setLocationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [surprisePicks, setSurprisePicks] = useState(null);
  const [shuffleDeck, setShuffleDeck] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [surpriseHistory, setSurpriseHistory] = useState([]);

  const filteredTrips = useMemo(() => {
    const departure = findCity(departureCity);
    return Array.from(
      new Map(
        trips
          .filter((trip) => trip?.id)
          .map((trip) => [trip.id, trip])
      ).values()
    )
      .filter((trip) => trip.total_price <= budget)
      .filter(
        (trip) =>
          !maxDistance || distanceInMiles(departure, trip) <= maxDistance
      )
      .filter((trip) => !tripTypes.length || tripTypes.includes(trip.trip_type))
      .filter(
        (trip) => !lodgingTypes.length || lodgingTypes.includes(trip.lodging_type)
      )
      .filter((trip) => !maxTravelTime || trip.travel_time_hours <= maxTravelTime)
      .sort((a, b) => a.total_price - b.total_price);
  }, [trips, budget, maxDistance, departureCity, tripTypes, lodgingTypes, maxTravelTime]);

  useEffect(() => {
    setSurpriseHistory([]);
  }, [filteredTrips]);

  const revealSurprise = async () => {
    if (isShuffling) return;
    const unseenTrips = filteredTrips.filter(
      (trip) => !surpriseHistory.includes(trip.id)
    );
    const pool = unseenTrips.length >= Math.min(3, filteredTrips.length)
      ? unseenTrips
      : filteredTrips;
    const nextPicks = shuffle(pool).slice(0, 3);
    setShuffleDeck(shuffle(pool).slice(0, 5));
    setSurprisePicks(null);
    setIsShuffling(true);
    await new Promise((resolve) => setTimeout(resolve, 950));
    setSurprisePicks(nextPicks);
    setSurpriseHistory((shown) => [
      ...shown,
      ...nextPicks.map((trip) => trip.id),
    ]);
    setIsShuffling(false);
  };

  const hasLivePrices = trips.some(
    (trip) => trip.price_source === "live" || trip.price_source === "mixed"
  );
  const hasMixedPrices = trips.some((trip) => trip.price_source === "mixed");

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl pt-safe">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2" aria-label="Weekndrr">
            <img
              src="/icons/icon-48.webp"
              alt=""
              className="h-8 w-8 rounded-lg"
            />
            <span className="sr-only">Weekndrr</span>
          </span>
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="flex max-w-[55%] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Departure city: ${departureCity}. Change city`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className={isDetectingLocation ? "truncate animate-pulse" : "truncate"}>
              {departureCity}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="space-y-7 px-4 py-5">
        <WeekendPicker
          weekends={weekends}
          selectedId={selectedWeekendId}
          onSelect={setSelectedWeekendId}
        />

        <BudgetSlider value={budget} onChange={setBudget} />

        <DistanceSlider value={maxDistance} onChange={setMaxDistance} />

        <div className="space-y-3">
          <Button
            variant="outline"
            className="h-12 w-full justify-center"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={revealSurprise}
            disabled={isShuffling}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/[0.03] text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          >
            <Sparkles className={cn("h-4 w-4", isShuffling && "animate-spin")} aria-hidden="true" />
            {isShuffling ? "Finding your escape…" : "Surprise Me!"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isShuffling ? (
            <ShuffleAnimation key="shuffle" trips={shuffleDeck} />
          ) : surprisePicks ? (
            <motion.section
              key="surprise"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
              aria-live="polite"
            >
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Your surprise picks
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={revealSurprise}
                      disabled={isShuffling}
                      aria-label="Shuffle surprise picks again"
                      className="rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurprisePicks(null)}
                      aria-label="Dismiss surprise picks"
                      className="rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {surprisePicks.length ? (
                  <div className="space-y-5">
                    {surprisePicks.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        isSaved={isSaved(trip.id)}
                        onToggleSave={toggleSaved}
                        weekendId={selectedWeekendId}
                        disabled={isFetching}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing to surprise you with — widen your budget or filters.
                  </p>
                )}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <section aria-labelledby="results-heading" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 id="results-heading" className="text-sm font-semibold text-slate-900">
              {filteredTrips.length} trip{filteredTrips.length === 1 ? "" : "s"} found
            </h2>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {liveSearchEnabled && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    isFetching
                      ? "bg-slate-100 text-slate-500"
                      : hasLivePrices
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                  )}
                >
                  <Radio className="h-3 w-3" aria-hidden="true" />
                  {isFetching
                    ? "Updating…"
                    : hasMixedPrices
                      ? "Some prices estimated"
                      : hasLivePrices
                        ? "Live prices"
                      : "Demo prices"}
                </span>
              )}
              Sorted by lowest price
            </span>
          </div>

          <TripsList
            trips={filteredTrips}
            isLoading={isLoading}
            isSaved={isSaved}
            onToggleSave={toggleSaved}
            weekendId={selectedWeekendId}
            budget={budget}
            isUpdating={isFetching}
          />
        </section>
      </main>

      <LocationPicker
        open={locationOpen}
        onOpenChange={setLocationOpen}
        value={departureCity}
        onSelect={setDepartureCity}
        onDetect={detectLocation}
      />

      <FilterChips
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        tripTypes={tripTypes}
        setTripTypes={setTripTypes}
        lodgingTypes={lodgingTypes}
        setLodgingTypes={setLodgingTypes}
        maxTravelTime={maxTravelTime}
        setMaxTravelTime={setMaxTravelTime}
        onClear={clearFilters}
      />
    </div>
  );
}

function ShuffleAnimation({ trips }) {
  return (
    <motion.section
      key="shuffle-animation"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
      aria-live="polite"
      aria-label="Finding surprise destinations"
    >
      <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="relative h-40 w-56">
          {trips.map((trip, index) => (
            <motion.div
              key={`${trip.id}-${index}`}
              initial={{ opacity: 0, y: 30, rotate: (index - 2) * 8 }}
              animate={{
                opacity: 1,
                y: [18, -8, 8, 0],
                x: [index * 5 - 10, -index * 4, index * 3, 0],
                rotate: [(index - 2) * 8, (index - 2) * -5, (index - 2) * 4, 0],
              }}
              transition={{
                duration: 0.85,
                delay: index * 0.07,
                ease: "easeInOut",
              }}
              className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-lg"
              style={{ zIndex: trips.length - index }}
            >
              <img
                src={trip.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8">
                <p className="truncate text-sm font-semibold text-white">
                  {trip.destination}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-primary">
          Shuffling places worth leaving for
        </p>
      </div>
    </motion.section>
  );
}
