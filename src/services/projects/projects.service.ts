import { apiClient } from "@/lib/api-client";
import type { Project, ProjectMember, CreateProjectPayload, UpdateProjectPayload, AddProjectMemberPayload } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/projects",
  CREATE: "/api/v1/projects",
  GET: "/api/v1/projects/:id",
  UPDATE: "/api/v1/projects/:id",
  DELETE: "/api/v1/projects/:id",
  ADD_MEMBER: "/api/v1/projects/:id/members",
  LIST_MEMBERS: "/api/v1/projects/:id/members",
  REMOVE_MEMBER: "/api/v1/projects/:id/members/:userId",
};

export const projectsService = {
  list: (page?: number, limit?: number, organizationId?: string) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (organizationId) params.append("organization_id", organizationId);
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;
    return apiClient<{ data: Project[] }>(url, { method: "GET" });
  },

  create: (payload: CreateProjectPayload) =>
    apiClient<{ data: Project }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient<{ data: Project }>(ENDPOINTS.GET.replace(":id", id), {
      method: "GET",
    }),

  update: (id: string, payload: UpdateProjectPayload) =>
    apiClient<{ data: Project }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  addMember: (projectId: string, payload: AddProjectMemberPayload) =>
    apiClient<{ data: ProjectMember }>(
      ENDPOINTS.ADD_MEMBER.replace(":id", projectId),
      { method: "POST", body: payload }
    ),

  listMembers: (projectId: string) =>
    apiClient<{ data: { userId: string; name: string | null; role: string | null }[] }>(
      ENDPOINTS.LIST_MEMBERS.replace(":id", projectId),
      { method: "GET" }
    ),

  removeMember: (projectId: string, userId: string) =>
    apiClient<{ data: { message: string } }>(
      ENDPOINTS.REMOVE_MEMBER.replace(":id", projectId).replace(":userId", userId),
      { method: "DELETE" }
    ),
};
