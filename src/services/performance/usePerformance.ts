import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { performanceService } from "./performance.service";
import type {
  GeneratePerformancePayload,
  FinalizePerformancePayload,
  PerformanceFilters,
} from "@/types/performance";

const QUERY_KEYS = {
  list: (filters?: PerformanceFilters) => ["performance", filters],
  detail: (id: string) => ["performance", id],
};

export function usePerformanceList(filters?: PerformanceFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => performanceService.list(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useGeneratePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GeneratePerformancePayload) => performanceService.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}

export function useFinalizePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FinalizePerformancePayload }) =>
      performanceService.finalize(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}
