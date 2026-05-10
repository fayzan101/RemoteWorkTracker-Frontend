import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "./departments.service";
import type { CreateDepartmentPayload, UpdateDepartmentPayload, ReassignUsersPayload } from "@/types";

const QUERY_KEYS = {
  list: ["departments"],
  detail: (id: string) => ["departments", id],
};

export function useDepartmentsList() {
  return useQuery({
    queryKey: QUERY_KEYS.list,
    queryFn: () => departmentsService.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDepartmentDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => departmentsService.getById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentPayload) => departmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDepartmentPayload) => departmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

export function useDeleteDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => departmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}

export function useReassignUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReassignUsersPayload) => departmentsService.reassignUsers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}
