export interface Course {
  course_id?: string;
  courseId?: string;
  title: string;
  description?: string;
  instructor_id?: string;
  instructorId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CourseEnrollment {
  enrollment_id?: string;
  enrollmentId?: string;
  course_id?: string;
  courseId?: string;
  user_id?: string;
  userId?: string;
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED';
  progress?: number;
  completed_at?: string;
  completedAt?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  course?: {
    course_id?: string;
    courseId?: string;
    title?: string;
  };
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  instructorId: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  instructorId?: string;
}

export interface EnrollInCoursePayload {
  userId: string;
}

export interface CourseListFilters {
  page?: number;
  limit?: number;
}

export interface EnrollmentListFilters {
  page?: number;
  limit?: number;
  status?: 'ENROLLED' | 'COMPLETED' | 'DROPPED';
  userId?: string;
  courseId?: string;
}
