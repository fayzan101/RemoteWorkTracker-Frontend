import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "./users.service";
import type { CreateUserPayload, UpdateUserPayload } from "@/types";

const QUERY_KEYS = {
  list: ["users"],
  detail: (id: string) => ["users", id],
  managers: ["users", "managers"],
};

export function useUsersList() {
  return useQuery({
    queryKey: QUERY_KEYS.list,
    queryFn: () => usersService.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => usersService.getById(id),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.managers });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPayload) => usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.managers });
    },
  });
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.managers });
    },
  });
}

export function useUsersManagers(organizationId?: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.managers, organizationId ?? ""],
    queryFn: () => usersService.managers(organizationId ?? undefined),
    staleTime: 1000 * 60 * 5,
  });
}
