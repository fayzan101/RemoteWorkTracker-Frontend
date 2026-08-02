'use client';

import { useMemo, useRef, useState } from 'react';
import styles from '../../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useCoursesList, useEnrollInCourse, useEnrollmentsList } from '@/services/learning/useLearning';
import { useUsersList } from '@/services/users/useUsers';
import type { Course, CourseEnrollment, EnrollmentListFilters } from '@/types';

type MaybeListResponse<T> = { data?: T[] } | T[] | undefined;

function resolveListData<T>(payload: MaybeListResponse<T>) {
  if (Array.isArray(payload)) return payload;
  return payload?.data || [];
}

export default function EnrollmentsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentListFilters['status'] | ''>('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');

  const enrollmentFilters = useMemo<EnrollmentListFilters>(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filterCourseId ? { courseId: filterCourseId } : {}),
      ...(filterUserId ? { userId: filterUserId } : {}),
    }),
    [statusFilter, filterCourseId, filterUserId]
  );

  const { data: coursesResponse, isLoading: isCoursesLoading, isError: isCoursesError } = useCoursesList();
  const { data: usersResponse, isLoading: isUsersLoading, isError: isUsersError } = useUsersList();
  const { data: enrollmentsResponse, isLoading: isEnrollmentsLoading } = useEnrollmentsList(enrollmentFilters);

  const enrollInCourse = useEnrollInCourse();

  const courses = resolveListData(coursesResponse?.data as MaybeListResponse<Course>);
  const users = resolveListData(usersResponse?.data as MaybeListResponse<any>);
  const enrollments = resolveListData(enrollmentsResponse?.data as MaybeListResponse<CourseEnrollment>);

  const courseOptions = useMemo(
    () =>
      courses
        .map((course: Course) => {
          const id = course.course_id || course.courseId || '';
          return {
            id,
            label: course.title || id,
          };
        })
        .filter((course) => Boolean(course.id)),
    [courses]
  );

  const userOptions = useMemo(
    () =>
      users
        .map((user) => {
          const id = user.user_id || user.userId || user.id || '';
          return {
            id,
            label: (user.name || user.email || 'User').trim(),
          };
        })
        .filter((user) => Boolean(user.id)),
    [users]
  );

  const userLabelById = useMemo(() => new Map(userOptions.map((u) => [u.id, u.label])), [userOptions]);
  const courseLabelById = useMemo(() => new Map(courseOptions.map((c) => [c.id, c.label])), [courseOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedCourseId) {
      setSubmitError('Please select a course.');
      return;
    }

    if (!selectedUserId) {
      setSubmitError('Please select a user.');
      return;
    }

    try {
      await enrollInCourse.mutateAsync({
        courseId: selectedCourseId,
        data: { userId: selectedUserId },
      });
      setSelectedCourseId('');
      setSelectedUserId('');
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enroll user.';
      setSubmitError(message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setSelectedCourseId('');
    setSelectedUserId('');
  };

  const getEnrollmentCourseId = (enrollment: CourseEnrollment) => enrollment.course_id || enrollment.courseId || '';
  const getEnrollmentUserId = (enrollment: CourseEnrollment) => enrollment.user_id || enrollment.userId || '';
  const getEnrollmentCreatedAt = (enrollment: CourseEnrollment) => enrollment.created_at || enrollment.createdAt || '';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Course Enrollments</h1>
          <p className={styles.pageSubtitle}>Enroll users in courses and monitor enrollment status</p>
        </div>
        <ActionButton
          label="Enroll User"
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <div className={styles.panelCard} style={{ marginBottom: '20px' }}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>Filters</div>
          <p className={styles.panelCardHint}>Narrow enrollments by status, course, or employee.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <FormField label="Status">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value || '') as EnrollmentListFilters['status'] | '')}
            >
              <option value="">All statuses</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </FormField>
          <FormField label="Course">
            <select value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}>
              <option value="">All courses</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Employee">
            <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
              <option value="">All employees</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable<CourseEnrollment>
        data={enrollments}
        columns={[
          {
            header: 'Course',
            accessor: (enrollment) => {
              const courseId = getEnrollmentCourseId(enrollment);
              const fromJoinedCourse = enrollment.course?.title;
              return fromJoinedCourse || courseLabelById.get(courseId) || courseId || '-';
            },
            width: '25%',
          },
          {
            header: 'User',
            accessor: (enrollment) => {
              const userId = getEnrollmentUserId(enrollment);
              if (!userId) return '-';
              return userLabelById.get(userId) || '—';
            },
            width: '25%',
          },
          {
            header: 'Status',
            accessor: (enrollment) => enrollment.status,
            width: '12%',
          },
          {
            header: 'Created',
            accessor: (enrollment) => {
              const createdAt = getEnrollmentCreatedAt(enrollment);
              return createdAt ? new Date(createdAt).toLocaleDateString() : '-';
            },
            width: '18%',
          },
        ]}
        isLoading={isEnrollmentsLoading}
        emptyMessage="No enrollments found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Enroll User In Course"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton
              label="Cancel"
              onClick={closeModal}
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
            <ActionButton
              label="Enroll"
              onClick={() => formRef.current?.requestSubmit()}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
          </div>
        }
      >
        <form ref={formRef} onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              {submitError}
            </div>
          )}

          <FormField label="Course" required>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
              disabled={isCoursesLoading || courseOptions.length === 0}
            >
              <option value="">
                {isCoursesLoading
                  ? 'Loading courses...'
                  : courseOptions.length === 0
                    ? 'No courses available. Please create courses first.'
                    : 'Select course'}
              </option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="User" required>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              disabled={isUsersLoading || userOptions.length === 0}
            >
              <option value="">
                {isUsersLoading
                  ? 'Loading users...'
                  : userOptions.length === 0
                    ? 'No users available. Please create users first.'
                    : 'Select user'}
              </option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </FormField>

          {isCoursesError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load courses.
            </div>
          )}

          {isUsersError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load users.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
