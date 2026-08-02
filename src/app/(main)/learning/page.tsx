'use client';

import { useRef, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useCoursesList, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/services/learning/useLearning';
import { useUsersList } from '@/services/users/useUsers';
import type { Course, CreateCoursePayload } from '@/types';

const emptyForm: CreateCoursePayload = {
  title: '',
  description: '',
  instructorId: '',
};

export default function LearningPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCoursePayload>(emptyForm);

  const { data: response, isLoading } = useCoursesList();
  const { data: usersResponse, isLoading: isUsersLoading, isError: isUsersError } = useUsersList();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const courses = response?.data || [];
  const usersList = usersResponse?.data || [];
  const userOptions = usersList
    .map((user) => {
      const id = user.user_id || user.userId || user.id || '';
      const label = (user.name || user.email || 'Instructor').trim();
      return { id, label };
    })
    .filter((user) => Boolean(user.id));

  const userLabelById = new Map(userOptions.map((user) => [user.id, user.label]));

  const getCourseId = (course: Course) => course.course_id || course.courseId || '';
  const getInstructorId = (course: Course) => course.instructor_id || course.instructorId || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('Course title is required.');
      return;
    }
    if (!formData.instructorId) {
      setSubmitError('Please select an instructor.');
      return;
    }

    try {
      if (editingId) {
        await updateCourse.mutateAsync({ id: editingId, data: formData });
      } else {
        await createCourse.mutateAsync(formData);
      }
      setFormData(emptyForm);
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save course.';
      setSubmitError(message);
      console.error('Error:', error);
    }
  };

  const handleEdit = (course: Course) => {
    const courseId = getCourseId(course);
    if (!courseId) {
      setSubmitError('Invalid course ID. Please refresh and try again.');
      return;
    }

    setEditingId(courseId);
    setFormData({
      title: course.title,
      description: course.description,
      instructorId: getInstructorId(course),
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!id) {
      setSubmitError('Invalid course ID. Please refresh and try again.');
      return;
    }
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteId) {
        await deleteCourse.mutateAsync(deleteId);
      }
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course.';
      setSubmitError(message);
      toast.error(message);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSubmitError(null);
    setFormData(emptyForm);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Learning & Courses</h1>
          <p className={styles.pageSubtitle}>Manage courses and employee learning</p>
        </div>
        <ActionButton 
          label="Add Course" 
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <DataTable<Course>
        data={courses}
        columns={[
          { header: 'Course Title', accessor: 'title', width: '30%' },
          { header: 'Description', accessor: 'description', width: '35%' },
          {
            header: 'Instructor',
            accessor: (course) => {
              const instructorId = getInstructorId(course);
              const label = userLabelById.get(instructorId);
              if (!instructorId) return '-';
              return label || '—';
            },
            width: '20%',
          },
          {
            header: 'Actions',
            accessor: (course) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(course)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit course"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(getCourseId(course))}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete course"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '15%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No courses found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Course' : 'Create New Course'}
        size="large"
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
              label={editingId ? 'Update' : 'Create'}
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
          <FormField label="Course Title" required>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </FormField>
          <FormField label="Instructor" required>
            <select
              value={formData.instructorId}
              onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
              required
              disabled={isUsersLoading || userOptions.length === 0}
            >
              <option value="">
                {isUsersLoading
                  ? 'Loading users...'
                  : userOptions.length === 0
                    ? 'No users available. Please create users first.'
                    : 'Select instructor'}
              </option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </FormField>
          {isUsersError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load users for instructor selection.
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteCourse.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
