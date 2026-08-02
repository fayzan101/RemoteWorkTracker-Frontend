import { apiClient } from "@/lib/api-client";
import type { Notification, NotificationFilters, NotificationListResponse } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/notifications",
  MARK_READ: "/api/v1/notifications/:id/read",
  MARK_ALL_READ: "/api/v1/notifications/read-all",
  DELETE: "/api/v1/notifications/:id",
  PUSH_TOKEN: "/api/v1/notifications/push-token",
};

export const notificationsService = {
  list: (filters?: NotificationFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.status) params.append("status", filters.status);
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;
    return apiClient<{ data: NotificationListResponse }>(url, { method: "GET" });
  },

  markAsRead: (id: string) =>
    apiClient<{ data: Notification }>(ENDPOINTS.MARK_READ.replace(":id", id), {
      method: "PATCH",
    }),

  markAllAsRead: () =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.MARK_ALL_READ, {
      method: "PATCH",
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  registerPushToken: (token: string, platform?: string) =>
    apiClient<{ data: { message?: string } }>(ENDPOINTS.PUSH_TOKEN, {
      method: "POST",
      body: { token, platform },
    }),

  unregisterPushToken: (token: string) =>
    apiClient<{ data: { message?: string } }>(ENDPOINTS.PUSH_TOKEN, {
      method: "DELETE",
      body: { token },
    }),
};
