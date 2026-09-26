import { AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import TripCard from "@/components/trips/TripCard";
import { Skeleton } from "@/components/ui/skeleton";

export function TripsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2.5">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function TripsList({
  trips,
  isLoading,
  isSaved,
  onToggleSave,
  weekendId,
  budget,
  isUpdating,
}) {
  if (isLoading) return <TripsSkeleton />;

  if (!trips.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <Compass className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          No trips under ${budget}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try raising your budget or clearing a filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            isSaved={isSaved(trip.id)}
            onToggleSave={onToggleSave}
            weekendId={weekendId}
            disabled={isUpdating}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
