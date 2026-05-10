import { apiClient } from "@/lib/api-client";
import type { Goal, CreateGoalPayload, UpdateGoalPayload, UpdateGoalProgressPayload, GoalFilters } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/goals",
  CREATE: "/api/v1/goals",
  GET: "/api/v1/goals/:id",
  UPDATE: "/api/v1/goals/:id",
  DELETE: "/api/v1/goals/:id",
  UPDATE_PROGRESS: "/api/v1/goals/:id/progress",
};

export const goalsService = {
  list: (filters?: GoalFilters) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.organizationId) params.append("organizationId", filters.organizationId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;
    return apiClient<{ data: Goal[] | { meta: unknown; data: Goal[] } }>(url, { method: "GET" });
  },

  create: (payload: CreateGoalPayload) =>
    apiClient<{ data: Goal }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient<{ data: Goal }>(ENDPOINTS.GET.replace(":id", id), {
      method: "GET",
    }),

  update: (id: string, payload: UpdateGoalPayload) =>
    apiClient<{ data: Goal }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  updateProgress: (id: string, payload: UpdateGoalProgressPayload) =>
    apiClient<{ data: Goal }>(ENDPOINTS.UPDATE_PROGRESS.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),
};
