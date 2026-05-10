import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "./tasks.service";
import type { TaskFilters, CreateTaskInput, UpdateTaskInput } from "@/types";

const QUERY_KEYS = {
  list: (filters?: TaskFilters) => ["tasks", "list", filters],
  detail: (id: string) => ["tasks", "detail", id],
  comments: (taskId: string) => ["tasks", "comments", taskId],
};

export function useTasksList(filters?: TaskFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => tasksService.list(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTaskDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => tasksService.getOne(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.comments(taskId),
    queryFn: () => tasksService.getComments(taskId),
    staleTime: 1000 * 60 * 2,
    enabled: !!taskId,
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
      tasksService.addComment(taskId, comment),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments(taskId) });
    },
  });
}
