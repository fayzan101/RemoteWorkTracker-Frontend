import { apiClient } from "@/lib/api-client";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/organizations/users",
  CREATE: "/api/v1/organizations/register",
  GET: "/api/v1/organizations/users/:id",
  UPDATE: "/api/v1/organizations/users/:id",
  DELETE: "/api/v1/organizations/users/:id",
  /** Backend: GET /api/v1/users/managers — optional ?organizationId= */
  MANAGERS: "/api/v1/users/managers",
};

export const usersService = {
  list: () =>
    apiClient<{ data: User[] }>(ENDPOINTS.LIST, {
      method: "GET",
    }),

  create: (payload: CreateUserPayload) =>
    apiClient<User>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    }),

  getById: async (id: string) => {
    const listed = await apiClient<{ data: User[] }>(ENDPOINTS.LIST, { method: "GET" });
    const users = listed?.data ?? [];
    const found = users.find(
      (u) => u.user_id === id || u.userId === id || u.id === id
    );
    if (!found) {
      throw new Error("User not found");
    }
    return found;
  },

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient<User>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  managers: (organizationId?: string) => {
    const qs =
      organizationId != null && organizationId !== ""
        ? `?organizationId=${encodeURIComponent(organizationId)}`
        : "";
    return apiClient<{ data: User[] }>(`${ENDPOINTS.MANAGERS}${qs}`, {
      method: "GET",
    });
  },
};
