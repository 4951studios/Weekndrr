import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/client";
import { liveSearchEnabled, searchTrips, uniqueTrips } from "@/api/providers";

export function useTrips({ departureCity, weekend } = {}) {
  return useQuery({
    queryKey: ["trips", liveSearchEnabled ? departureCity : null, weekend?.id ?? null],
    queryFn: () =>
      liveSearchEnabled
        ? searchTrips({ departureCity, weekend })
        : entities.Trip.list("total_price").then(uniqueTrips),
    staleTime: liveSearchEnabled ? 5 * 60 * 1000 : Infinity,
    placeholderData: (previous) => previous,
  });
}

export function useTrip(id) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => entities.Trip.get(id),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useSavedTrips() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saved-trips"],
    queryFn: () => entities.SavedTrip.list(),
  });

  const toggle = useMutation({
    mutationFn: async (tripId) => {
      const saved = await entities.SavedTrip.list();
      const existing = saved.find((row) => row.trip_id === tripId);
      if (existing) return entities.SavedTrip.delete(existing.id);
      return entities.SavedTrip.create({ trip_id: tripId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-trips"] }),
  });

  const savedIds = new Set((query.data ?? []).map((row) => row.trip_id));

  return {
    savedTrips: query.data ?? [],
    savedIds,
    isSaved: (tripId) => savedIds.has(tripId),
    toggleSaved: (tripId) => toggle.mutate(tripId),
    isLoading: query.isLoading,
    isError: query.isError || toggle.isError,
    retry: () => query.refetch(),
  };
}

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => entities.Booking.list("-created_date"),
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => entities.Booking.get(id),
    enabled: Boolean(id),
  });
}
