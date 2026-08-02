import { apiClient } from "@/lib/api-client";
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload, ReassignUsersPayload } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/departments",
  CREATE: "/api/v1/departments",
  GET: "/api/v1/departments/:id",
  UPDATE: "/api/v1/departments/:id",
  DELETE: "/api/v1/departments/:id",
  REASSIGN: "/api/v1/departments/reassign-users",
};

export const departmentsService = {
  list: () =>
    apiClient<{ data: Department[] }>(ENDPOINTS.LIST, {
      method: "GET",
    }),

  create: (payload: CreateDepartmentPayload) =>
    apiClient<{ data: Department }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: { name: payload.name },
    }),

  getById: (id: string) =>
    apiClient<{ data: Department }>(ENDPOINTS.GET.replace(":id", id), {
      method: "GET",
    }),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiClient<{ data: Department }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  reassignUsers: (payload: ReassignUsersPayload) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.REASSIGN, {
      method: "PUT",
      body: payload,
    }),
};
