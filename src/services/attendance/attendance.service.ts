import { apiClient } from "@/lib/api-client";
import type {
  AttendanceFilters,
  AttendanceListResponse,
  AttendanceLog,
  CreateGeoFencePayload,
  GeoFence,
} from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/attendance",
  LIST_MY: "/api/v1/attendance/me",
  CHECK_IN: "/api/v1/attendance/check-in",
  CHECK_OUT: "/api/v1/attendance/check-out",
  GEO_FENCES: "/api/v1/attendance/geo-fences",
  GEO_FENCE: "/api/v1/attendance/geo-fences/:id",
};

export const attendanceService = {
  listAll: (filters?: AttendanceFilters) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.organizationId) params.append("organizationId", filters.organizationId);

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;

    return apiClient<{ data: AttendanceListResponse | AttendanceLog[] }>(url, { method: "GET" });
  },

  listMy: (filters?: AttendanceFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST_MY}?${queryString}` : ENDPOINTS.LIST_MY;

    return apiClient<{ data: AttendanceListResponse | AttendanceLog[] }>(url, { method: "GET" });
  },

  checkIn: (payload: {
    latitude: number;
    longitude: number;
    ipAddress: string;
    deviceId?: string;
  }) =>
    apiClient<{ data: AttendanceLog }>(ENDPOINTS.CHECK_IN, {
      method: "POST",
      body: payload,
    }),

  checkOut: (payload: { sessionId: string; deviceId?: string }) =>
    apiClient<{ data: AttendanceLog }>(ENDPOINTS.CHECK_OUT, {
      method: "POST",
      body: payload,
    }),

  listGeoFences: () =>
    apiClient<{ data: GeoFence[] }>(ENDPOINTS.GEO_FENCES, { method: "GET" }),

  createGeoFence: (payload: CreateGeoFencePayload) =>
    apiClient<{ data: GeoFence }>(ENDPOINTS.GEO_FENCES, {
      method: "POST",
      body: payload,
    }),

  deleteGeoFence: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.GEO_FENCE.replace(":id", id), {
      method: "DELETE",
    }),
};
