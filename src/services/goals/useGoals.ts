import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goalsService } from "./goals.service";
import type { CreateGoalPayload, UpdateGoalPayload, UpdateGoalProgressPayload, GoalFilters } from "@/types";

const QUERY_KEYS = {
  list: (filters?: GoalFilters) => ["goals", filters],
  detail: (id: string) => ["goals", id],
};

export function useGoalsList(filters?: GoalFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => goalsService.list(filters),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useGoalDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => goalsService.getById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalPayload) => goalsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGoalPayload) => goalsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

export function useDeleteGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => goalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoalProgress(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGoalProgressPayload) => goalsService.updateProgress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}
