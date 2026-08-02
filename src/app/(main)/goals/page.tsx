'use client';

import { useRef, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  useGoalsList,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useUpdateGoalProgress,
} from '@/services/goals/useGoals';
import { useUsersList } from '@/services/users/useUsers';
import { useAuth } from '@/hooks';
import { unwrapApiList } from '@/app/(main)/dashboard/dashboard-helpers';
import type { Goal, CreateGoalPayload } from '@/types';

const emptyForm: CreateGoalPayload & { progress: number } = {
  title: '',
  userId: '',
  description: '',
  deadline: '',
  progress: 0,
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
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'' | 'ON_TRACK' | 'AT_RISK'>('');
  const { data: response, isLoading, isError } = useGoalsList(
    {
      limit: 200,
      organizationId: organizationId ?? undefined,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    { enabled: !!organizationId }
  );
  const { data: usersResponse, isLoading: isUsersLoading, isError: isUsersError } = useUsersList();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal(editingId || '');
  const updateProgress = useUpdateGoalProgress(editingId || '');
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
        await updateGoal.mutateAsync({
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
        });
        const progress = Math.min(100, Math.max(0, Number(formData.progress) || 0));
        await updateProgress.mutateAsync({ progress });
      } else {
        await createGoal.mutateAsync({
          title: formData.title,
          userId: formData.userId,
          description: formData.description,
          deadline: formData.deadline,
        });
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
      progress: typeof goal.progress === 'number' ? goal.progress : 0,
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
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete goal.');
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

      {isError && (
        <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load goals. Please try again.
        </div>
      )}

      <div className={styles.panelCard} style={{ marginBottom: '20px' }}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>Filters</div>
        </div>
        <FormField label="Status">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'ON_TRACK' | 'AT_RISK')}
            style={{ maxWidth: '240px' }}
          >
            <option value="">All statuses</option>
            <option value="ON_TRACK">On track</option>
            <option value="AT_RISK">At risk</option>
          </select>
        </FormField>
      </div>

      <DataTable<Goal>
        data={goals}
        columns={[
          { header: 'Goal Title', accessor: 'title', width: '25%' },
          {
            header: 'User',
            accessor: (goal) => userLabelById.get(getGoalUserId(goal)) || 'Unknown employee',
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
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>{submitError}</div>
          )}
          <FormField label="Goal Title" required>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Employee" required>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              disabled={!!editingId || isUsersLoading || userOptions.length === 0}
            >
              <option value="">
                {isUsersLoading
                  ? 'Loading users...'
                  : userOptions.length === 0
                    ? 'No users available. Please create users first.'
                    : 'Select employee'}
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
          {editingId && (
            <FormField label="Progress (%)" required>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                required
              />
            </FormField>
          )}
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
