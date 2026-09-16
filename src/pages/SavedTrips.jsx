import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useSavedTrips, useTrips } from "@/hooks/useEntities";
import TripsList from "@/components/trips/TripsList";
import { Button } from "@/components/ui/button";

export default function SavedTrips() {
  const { data: trips = [], isLoading } = useTrips();
  const {
    savedIds,
    isSaved,
    toggleSaved,
    isLoading: savedLoading,
    isError: savedError,
    retry: retrySaved,
  } = useSavedTrips();

  const saved = trips.filter((trip) => savedIds.has(trip.id));

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl pt-safe">
        <h1 className="text-xl font-bold text-slate-900">Saved trips</h1>
      </header>

      <main className="px-4 py-5">
        {savedError ? (
          <div role="alert" className="rounded-2xl bg-rose-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-rose-800">
              We couldn’t load your saved trips.
            </p>
            <Button variant="outline" className="mt-4" onClick={retrySaved}>
              Try again
            </Button>
          </div>
        ) : !isLoading && !savedLoading && saved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-rose-200" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-slate-900">
              No saved trips yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any trip to keep it here.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Start exploring</Link>
            </Button>
          </div>
        ) : (
          <TripsList
            trips={saved}
            isLoading={isLoading || savedLoading}
            isSaved={isSaved}
            onToggleSave={toggleSaved}
          />
        )}
      </main>
    </div>
  );
}
