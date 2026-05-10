import { apiClient } from "@/lib/api-client";
import type {
  WellnessLog,
  CreateWellnessLogPayload,
  WellnessFilters,
  WellnessListResponse,
} from "@/types";

const ENDPOINTS = {
  LOG_MOOD: "/api/v1/wellness/mood",
  LIST: "/api/v1/wellness",
  LIST_MY: "/api/v1/wellness/me",
};

export const wellnessService = {
  logMood: (payload: CreateWellnessLogPayload) =>
    apiClient<{ data: WellnessLog }>(ENDPOINTS.LOG_MOOD, {
      method: "POST",
      body: payload,
    }),

  listAll: (filters?: WellnessFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.mood) params.append("mood", filters.mood);
    if (filters?.minEnergy) params.append("minEnergy", filters.minEnergy.toString());
    if (filters?.maxEnergy) params.append("maxEnergy", filters.maxEnergy.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.organizationId) params.append("organizationId", filters.organizationId);
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;
    return apiClient<{ data: WellnessListResponse }>(url, { method: "GET" });
  },

  listMy: (filters?: WellnessFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.mood) params.append("mood", filters.mood);
    if (filters?.minEnergy) params.append("minEnergy", filters.minEnergy.toString());
    if (filters?.maxEnergy) params.append("maxEnergy", filters.maxEnergy.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST_MY}?${queryString}` : ENDPOINTS.LIST_MY;
    return apiClient<{ data: WellnessListResponse }>(url, { method: "GET" });
  },
};
