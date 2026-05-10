import { apiClient } from "@/lib/api-client";
import type { Role, CreateRolePayload, UpdateRolePayload } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/roles",
  CREATE: "/api/v1/roles",
  GET: "/api/v1/roles/:id",
  UPDATE: "/api/v1/roles/:id",
  DELETE: "/api/v1/roles/:id",
};

export const rolesService = {
  list: () =>
    apiClient<{ roles: Role[] }>(ENDPOINTS.LIST, {
      method: "GET",
    }),

  create: (payload: CreateRolePayload) =>
    apiClient<{ data: Role }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient<{ data: Role }>(ENDPOINTS.GET.replace(":id", id), {
      method: "GET",
    }),

  update: (id: string, payload: UpdateRolePayload) =>
    apiClient<{ data: Role }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),
};
