import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "./projects.service";
import type { CreateProjectPayload, UpdateProjectPayload, AddProjectMemberPayload } from "@/types";

const QUERY_KEYS = {
  list: ["projects"],
  detail: (id: string) => ["projects", id],
};

export function useProjectsList(page?: number, limit?: number, organizationId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.list, page, limit, organizationId],
    queryFn: () => projectsService.list(page, limit, organizationId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => projectsService.getById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectPayload) => projectsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectPayload) => projectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
}

export function useDeleteProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => projectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddProjectMemberPayload) => projectsService.addMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects", "members", projectId] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsService.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects", "members", projectId] });
    },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["projects", "members", projectId],
    queryFn: () => projectsService.listMembers(projectId),
    staleTime: 1000 * 60 * 2,
    enabled: !!projectId,
  });
}
