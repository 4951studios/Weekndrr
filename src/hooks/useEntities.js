import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/client";
import { liveSearchEnabled, searchTrips, uniqueTrips } from "@/api/providers";
import { useToast } from "@/components/ui/toast";
import { originKey, tripForOrigin } from "@/lib/tripOrigin";

export function useTrips({ origin, weekend } = {}) {
  return useQuery({
    queryKey: [
      "trips",
      originKey(origin),
      liveSearchEnabled ? weekend?.id ?? null : null,
    ],
    queryFn: () =>
      origin
        ? searchTrips({ origin, weekend })
        : entities.Trip.list("total_price").then(uniqueTrips),
    staleTime: liveSearchEnabled ? 5 * 60 * 1000 : Infinity,
    placeholderData: (previous) => previous,
  });
}

export function useTrip(id, origin) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => entities.Trip.get(id),
    enabled: Boolean(id),
    staleTime: Infinity,
    select: (trip) => tripForOrigin(trip, origin),
  });
}

export function useSavedTrips() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saved-trips"],
    queryFn: () => entities.SavedTrip.list(),
  });

  const toast = useToast();

  const toggle = useMutation({
    mutationFn: async ({ tripId, save }) => {
      const saved = await entities.SavedTrip.list();
      const existing = saved.find((row) => row.trip_id === tripId);
      if (save) return existing ?? entities.SavedTrip.create({ trip_id: tripId });
      return existing ? entities.SavedTrip.delete(existing.id) : null;
    },
    onMutate: async ({ tripId, save }) => {
      await queryClient.cancelQueries({ queryKey: ["saved-trips"] });
      const previous = queryClient.getQueryData(["saved-trips"]);
      queryClient.setQueryData(["saved-trips"], (rows = []) =>
        save
          ? [...rows.filter((row) => row.trip_id !== tripId), { id: `optimistic-${tripId}`, trip_id: tripId }]
          : rows.filter((row) => row.trip_id !== tripId)
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["saved-trips"], context?.previous);
      toast.show("Couldn’t update saved trips. Please try again.", { tone: "error" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved-trips"] }),
  });

  const savedIds = new Set((query.data ?? []).map((row) => row.trip_id));

  const toggleSaved = (tripId) => {
    const save = !savedIds.has(tripId);
    toggle.mutate(
      { tripId, save },
      {
        onSuccess: () =>
          toast.show(save ? "Saved to your trips" : "Removed from saved trips", {
            action: {
              label: "Undo",
              onClick: () => toggle.mutate({ tripId, save: !save }),
            },
          }),
      }
    );
  };

  return {
    savedTrips: query.data ?? [],
    savedIds,
    isSaved: (tripId) => savedIds.has(tripId),
    toggleSaved,
    isLoading: query.isLoading,
    isError: query.isError,
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

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }) => entities.Booking.update(id, values),
    onSuccess: (_row, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
  });
}
