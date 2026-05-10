'use client';

import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useGoalsList, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/services/goals/useGoals';
import { useUsersList } from '@/services/users/useUsers';
import { useAuth } from '@/hooks';
import { unwrapApiList } from '@/app/(main)/dashboard/dashboard-helpers';
import type { Goal, CreateGoalPayload } from '@/types';

const emptyForm: CreateGoalPayload = {
  title: '',
  userId: '',
  description: '',
  deadline: '',
};

function getGoalId(goal: Goal) {
  return goal.goal_id || goal.goalId || '';
}

function getGoalUserId(goal: Goal) {
  return goal.user_id || goal.userId || '';
}

function toDateInputValue(value?: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGoalPayload>(emptyForm);

  const { organizationId } = useAuth();
  const { data: response, isLoading } = useGoalsList(
    { limit: 200, organizationId: organizationId ?? undefined },
    { enabled: !!organizationId }
  );
  const { data: usersResponse, isLoading: isUsersLoading, isError: isUsersError } = useUsersList();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal(editingId || '');
  const deleteGoal = useDeleteGoal(deleteId || '');

  const goals = unwrapApiList<Goal>(response as { data?: unknown });
  const usersList = usersResponse?.data || [];
  const userLabelById = new Map(
    usersList.map((user) => {
      const id = user.user_id || user.userId || user.id || '';
      const label = user.name || user.email || id;
      return [id, label];
    })
  );
  const userOptions = usersList
    .map((user) => {
      const id = user.user_id || user.userId || user.id || '';
      const label = user.name || user.email || id;
      return { id, label };
    })
    .filter((user) => Boolean(user.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('Goal title is required.');
      return;
    }
    if (!formData.userId) {
      setSubmitError('Please select a user.');
      return;
    }
    if (!formData.deadline) {
      setSubmitError('Deadline is required.');
      return;
    }

    try {
      if (editingId) {
        await updateGoal.mutateAsync(formData);
      } else {
        await createGoal.mutateAsync(formData);
      }
      setFormData(emptyForm);
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save goal.';
      setSubmitError(message);
      console.error('Error:', error);
    }
  };

  const handleEdit = (goal: Goal) => {
    const resolvedGoalId = getGoalId(goal);
    const resolvedUserId = getGoalUserId(goal);
    setEditingId(resolvedGoalId);
    setFormData({
      title: goal.title,
      userId: resolvedUserId,
      description: goal.description,
      deadline: toDateInputValue(goal.deadline),
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteId) {
        await deleteGoal.mutateAsync();
      }
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error:', error);
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
          <h1 className={styles.pageTitle}>Goals</h1>
          <p className={styles.pageSubtitle}>Manage employee goals and track progress</p>
        </div>
        <ActionButton 
          label="Add Goal" 
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <DataTable<Goal>
        data={goals}
        columns={[
          { header: 'Goal Title', accessor: 'title', width: '25%' },
          {
            header: 'User',
            accessor: (goal) => userLabelById.get(getGoalUserId(goal)) || getGoalUserId(goal) || '-',
            width: '20%',
          },
          { header: 'Description', accessor: 'description', width: '25%' },
          {
            header: 'Progress',
            accessor: (g) => `${g.progress}%`,
            width: '15%',
          },
          {
            header: 'Deadline',
            accessor: (g) => new Date(g.deadline).toLocaleDateString(),
            width: '15%',
          },
          {
            header: 'Actions',
            accessor: (goal) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(goal)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit goal"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(getGoalId(goal))}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete goal"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '15%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No goals found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Goal' : 'Create New Goal'}
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
              onClick={() => handleSubmit(new Event('submit') as any)}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              {submitError}
            </div>
          )}
          <FormField label="Goal Title" required>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>
          <FormField label="User ID" required>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
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
                  {user.label} ({user.id})
                </option>
              ))}
            </select>
          </FormField>
          {isUsersError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load users for selection.
            </div>
          )}
          <FormField label="Description">
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </FormField>
          <FormField label="Deadline" required>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteGoal.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
