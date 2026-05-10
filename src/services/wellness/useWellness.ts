import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wellnessService } from "./wellness.service";
import type { CreateWellnessLogPayload, WellnessFilters } from "@/types";

const QUERY_KEYS = {
  listAll: (filters?: WellnessFilters) => ["wellness", "all", filters],
  listMy: (filters?: WellnessFilters) => ["wellness", "me", filters],
};

export function useWellnessListAll(filters?: WellnessFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.listAll(filters),
    queryFn: () => wellnessService.listAll(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useWellnessListMy(filters?: WellnessFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.listMy(filters),
    queryFn: () => wellnessService.listMy(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWellnessLogPayload) => wellnessService.logMood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellness"] });
    },
  });
}
