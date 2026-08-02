import { apiClient } from "@/lib/api-client";
import type {
  PerformanceReview,
  GeneratePerformancePayload,
  FinalizePerformancePayload,
  PerformanceListResponse,
  PerformanceFilters,
} from "@/types/performance";

const ENDPOINTS = {
  LIST: "/api/v1/performance",
  GENERATE: "/api/v1/performance/generate",
  DETAIL: "/api/v1/performance/:id",
  FINALIZE: "/api/v1/performance/:id/finalize",
};

export const performanceService = {
  list: (filters?: PerformanceFilters) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.period) params.append("period", filters.period);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    const qs = params.toString();
    return apiClient<{ data: PerformanceListResponse }>(
      qs ? `${ENDPOINTS.LIST}?${qs}` : ENDPOINTS.LIST,
      { method: "GET" }
    );
  },

  generate: (payload: GeneratePerformancePayload) =>
    apiClient<{ data: PerformanceReview }>(ENDPOINTS.GENERATE, {
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient<{ data: PerformanceReview }>(ENDPOINTS.DETAIL.replace(":id", id), {
      method: "GET",
    }),

  finalize: (id: string, payload: FinalizePerformancePayload) =>
    apiClient<{ data: PerformanceReview }>(ENDPOINTS.FINALIZE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),
};
