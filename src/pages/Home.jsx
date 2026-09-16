import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Radio, RefreshCw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useSavedTrips, useTrips } from "@/hooks/useEntities";
import { liveSearchEnabled } from "@/api/providers";
import { cn } from "@/lib/utils";
import LocationPicker from "@/components/search/LocationPicker";
import WeekendPicker from "@/components/search/WeekendPicker";
import BudgetSlider from "@/components/search/BudgetSlider";
import FilterChips from "@/components/search/FilterChips";
import TripsList from "@/components/trips/TripsList";
import TripCard from "@/components/trips/TripCard";
import { Button } from "@/components/ui/button";
import { shuffle } from "@/utils";

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

  const filteredTrips = useMemo(() => {
    return trips
      .filter((trip) => trip.total_price <= budget)
      .filter((trip) => !tripTypes.length || tripTypes.includes(trip.trip_type))
      .filter(
        (trip) => !lodgingTypes.length || lodgingTypes.includes(trip.lodging_type)
      )
      .filter((trip) => !maxTravelTime || trip.travel_time_hours <= maxTravelTime)
      .sort((a, b) => a.total_price - b.total_price);
  }, [trips, budget, tripTypes, lodgingTypes, maxTravelTime]);

  const revealSurprise = () => setSurprisePicks(shuffle(filteredTrips).slice(0, 3));

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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/[0.03] text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Surprise Me!
          </button>
        </div>

        <AnimatePresence>
          {surprisePicks && (
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
                      aria-label="Shuffle surprise picks again"
                      className="rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          )}
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
