import { apiClient } from "@/lib/api-client";
import type { AttendanceFilters, AttendanceListResponse, AttendanceLog } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/attendance",
  LIST_MY: "/api/v1/attendance/me",
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
};
