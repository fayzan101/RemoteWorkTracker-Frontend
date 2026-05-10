import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesService } from "./roles.service";
import type { CreateRolePayload, UpdateRolePayload } from "@/types";

const QUERY_KEYS = {
  list: ["roles"],
  detail: (id: string) => ["roles", id],
};

export function useRolesList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.list,
    queryFn: () => rolesService.list(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

export function useRoleDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => rolesService.getById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRolePayload) => rolesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

export function useDeleteRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rolesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}
