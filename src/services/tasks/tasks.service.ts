import { apiClient } from "@/lib/api-client";
import type { TaskFilters, TaskListResponse, Task, CreateTaskInput, UpdateTaskInput } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/tasks",
  GET_ONE: "/api/v1/tasks/:id",
  CREATE: "/api/v1/tasks",
  UPDATE: "/api/v1/tasks/:id",
  DELETE: "/api/v1/tasks/:id",
  ADD_COMMENT: "/api/v1/tasks/:taskId/comments",
  GET_COMMENTS: "/api/v1/tasks/:taskId/comments",
  LIST_ATTACHMENTS: "/api/v1/tasks/:taskId/attachments",
  ADD_ATTACHMENT: "/api/v1/tasks/:taskId/attachments",
  DELETE_ATTACHMENT: "/api/v1/tasks/:taskId/attachments/:attachmentId",
};

export const tasksService = {
  list: (filters?: TaskFilters) => {
    const params = new URLSearchParams();
    if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters?.projectId) params.append("project_id", filters.projectId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;

    return apiClient<{ data: TaskListResponse }>(url, { method: "GET" });
  },

  getOne: (id: string) =>
    apiClient<{ data: Task }>(ENDPOINTS.GET_ONE.replace(":id", id), { method: "GET" }),

  create: (payload: CreateTaskInput) =>
    apiClient<{ data: Task }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: {
        project_id: payload.projectId,
        assigned_to: payload.assignedTo,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: "PENDING",
        deadline: payload.deadline ? String(payload.deadline).trim().slice(0, 10) : null,
      },
    }),

  update: (id: string, payload: UpdateTaskInput) =>
    apiClient<{ data: Task }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: {
        assigned_to: payload.assignedTo,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: payload.status,
        deadline: payload.deadline,
      },
    }),

  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  addComment: (taskId: string, comment: string) =>
    apiClient<{ data: { commentId: string } }>(
      ENDPOINTS.ADD_COMMENT.replace(":taskId", taskId),
      { method: "POST", body: { comment } }
    ),

  getComments: (taskId: string) =>
    apiClient<{ data: { taskId: string; comments: any[] } }>(
      ENDPOINTS.GET_COMMENTS.replace(":taskId", taskId),
      { method: "GET" }
    ),

  listAttachments: (taskId: string) =>
    apiClient<{ data: Array<{ attachment_id: string; file_path: string; created_at?: string }> }>(
      ENDPOINTS.LIST_ATTACHMENTS.replace(":taskId", taskId),
      { method: "GET" }
    ),

  addAttachment: (taskId: string, filePath: string) =>
    apiClient<{ data: { attachment_id: string; file_path: string } }>(
      ENDPOINTS.ADD_ATTACHMENT.replace(":taskId", taskId),
      { method: "POST", body: { file_path: filePath } }
    ),

  deleteAttachment: (taskId: string, attachmentId: string) =>
    apiClient<{ data: { message: string } }>(
      ENDPOINTS.DELETE_ATTACHMENT.replace(":taskId", taskId).replace(":attachmentId", attachmentId),
      { method: "DELETE" }
    ),
};
