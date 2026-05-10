import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learningService } from "./learning.service";
import type { CreateCoursePayload, UpdateCoursePayload, EnrollInCoursePayload, CourseListFilters, EnrollmentListFilters } from "@/types";

const QUERY_KEYS = {
  coursesList: (filters?: CourseListFilters) => ["courses", filters],
  courseDetail: (id: string) => ["courses", id],
  enrollmentsList: (filters?: EnrollmentListFilters) => ["enrollments", filters],
};

export function useCoursesList(filters?: CourseListFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.coursesList(filters),
    queryFn: () => learningService.listCourses(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.courseDetail(id),
    queryFn: () => learningService.getCourseById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoursePayload) => learningService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoursePayload }) => learningService.updateCourse(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.courseDetail(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: EnrollInCoursePayload }) =>
      learningService.enrollInCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useEnrollmentsList(filters?: EnrollmentListFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollmentsList(filters),
    queryFn: () => learningService.listEnrollments(filters),
    staleTime: 1000 * 60 * 5,
  });
}
