import { apiClient } from "@/lib/api-client";
import type { Course, CourseEnrollment, CreateCoursePayload, UpdateCoursePayload, EnrollInCoursePayload, CourseListFilters, EnrollmentListFilters } from "@/types";

const ENDPOINTS = {
  LIST: "/api/v1/courses",
  CREATE: "/api/v1/courses",
  GET: "/api/v1/courses/:id",
  UPDATE: "/api/v1/courses/:id",
  DELETE: "/api/v1/courses/:id",
  ENROLL: "/api/v1/courses/:id/enroll",
  ENROLLMENTS: "/api/v1/courses/enrollments",
};

export const learningService = {
  listCourses: (filters?: CourseListFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;
    return apiClient<{ data: Course[] }>(url, { method: "GET" });
  },

  createCourse: (payload: CreateCoursePayload) =>
    apiClient<{ data: Course }>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    }),

  getCourseById: (id: string) =>
    apiClient<{ data: Course }>(ENDPOINTS.GET.replace(":id", id), {
      method: "GET",
    }),

  updateCourse: (id: string, payload: UpdateCoursePayload) =>
    apiClient<{ data: Course }>(ENDPOINTS.UPDATE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  deleteCourse: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.DELETE.replace(":id", id), {
      method: "DELETE",
    }),

  enrollInCourse: (courseId: string, payload: EnrollInCoursePayload) =>
    apiClient<{ data: CourseEnrollment }>(
      ENDPOINTS.ENROLL.replace(":id", courseId),
      { method: "POST", body: payload }
    ),

  listEnrollments: (filters?: EnrollmentListFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.status) params.append("status", filters.status);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.courseId) params.append("courseId", filters.courseId);
    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.ENROLLMENTS}?${queryString}` : ENDPOINTS.ENROLLMENTS;
    return apiClient<{ data: CourseEnrollment[] }>(url, { method: "GET" });
  },
};
