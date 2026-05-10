'use client';

import { useMemo, useState } from 'react';
import { Edit, MessageSquare, Trash2 } from 'lucide-react';
import baseStyles from '../main-pages.module.css';
import styles from './tasks-page.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_COLORS, ACTION_BUTTON_SIZES } from '@/constants/actionButtons';
import { useTasksList, useCreateTask, useUpdateTask, useDeleteTask, useTaskComments, useAddTaskComment } from '@/services/tasks/useTasks';
import { useUsersList } from '@/services/users/useUsers';
import { useRolesList } from '@/services/roles/useRoles';
import { useProjectsList } from '@/services/projects/useProjects';
import { unwrapApiList } from '@/app/(main)/dashboard/dashboard-helpers';
import type { CreateTaskInput, Task, TaskPriority, TaskStatus, User, Project } from '@/types';

type TaskFormState = CreateTaskInput & {
  status: TaskStatus;
};

type ProjectOption = {
  id: string;
  label: string;
};

const STATUS_OPTIONS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  assignedTo: '',
  projectId: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  deadline: '',
};

function getTaskId(task: Task) {
  return task.task_id || task.taskId || '';
}

function getAssignedUserId(task: Task) {
  return task.assigned_to || task.assignedTo || '';
}

function getProjectId(task: Task) {
  return task.project_id || task.projectId || '';
}

function getTaskDeadlineValue(task: Task): string | undefined {
  const raw: unknown = task.deadline ?? (task as { due_date?: unknown }).due_date;
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t === '' ? undefined : t;
  }
  if (raw && typeof raw === 'object' && raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  return s === '' ? undefined : s;
}

function toDateInputValue(value?: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function prettyStatus(status: TaskStatus) {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  return 'Pending';
}

function priorityColor(priority: TaskPriority) {
  if (priority === 'HIGH') return { background: 'rgba(239, 68, 68, 0.14)', color: '#b91c1c' };
  if (priority === 'MEDIUM') return { background: 'rgba(249, 115, 22, 0.16)', color: '#c2410c' };
  return { background: 'rgba(34, 197, 94, 0.14)', color: '#15803d' };
}

function getUserId(user: User) {
  return user.user_id || user.userId || user.id || '';
}

function isEmployeeRole(roleName: string) {
  const normalized = roleName.toLowerCase();
  if (!normalized) return true;
  const managerLike = ['manager', 'admin', 'owner', 'lead'];
  return !managerLike.some((role) => normalized.includes(role));
}

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTaskForComments, setActiveTaskForComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [formData, setFormData] = useState<TaskFormState>(emptyForm);

  const filters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
    }),
    [statusFilter, priorityFilter]
  );

  const { data: tasksResponse, isLoading } = useTasksList(filters);
  const { data: usersResponse, isLoading: isUsersLoading } = useUsersList();
  const { data: rolesResponse } = useRolesList();
  // Match Projects page: list is not scoped by organization_id query param so the dropdown stays in sync with /projects.
  const { data: projectsResponse, isLoading: isProjectsLoading } = useProjectsList(1, 100);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddTaskComment();

  const commentsTaskId = activeTaskForComments || '';
  const { data: commentsResponse, isLoading: isCommentsLoading } = useTaskComments(commentsTaskId);

  const tasksPayload = tasksResponse?.data;
  const tasks = useMemo(() => {
    if (!tasksPayload) return [] as Task[];
    if (Array.isArray(tasksPayload)) return tasksPayload as Task[];
    if (Array.isArray(tasksPayload.data)) return tasksPayload.data as Task[];
    return [] as Task[];
  }, [tasksPayload]);

  const rolesList = Array.isArray(rolesResponse?.roles) ? rolesResponse!.roles : [];
  const roleNameById = new Map(rolesList.map((role) => [role.role_id, role.name]));

  const usersPayload = usersResponse?.data;
  const usersList = Array.isArray(usersPayload) ? usersPayload : [];
  const employeeOptions = usersList
    .filter((user) => {
      const roleId = user.role_id || user.roleId || '';
      const roleName = roleNameById.get(roleId) || '';
      return isEmployeeRole(roleName);
    })
    .map((user) => {
      const id = getUserId(user);
      return {
        id,
        label: user.name || user.email || id,
      };
    })
    .filter((option) => Boolean(option.id));

  const projectsList = unwrapApiList<Project>(projectsResponse as { data?: unknown });
  const projectOptions: ProjectOption[] = projectsList
    .map((project: Project) => {
      const id = project.project_id || (project as { projectId?: string }).projectId || '';
      return { id, label: project.name };
    })
    .filter((option: ProjectOption) => Boolean(option.id));

  const employeeNameById = new Map<string, string>(employeeOptions.map((option) => [option.id, option.label]));
  const projectNameById = new Map<string, string>(projectOptions.map((option) => [option.id, option.label]));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const pendingTasks = tasks.filter((task) => task.status === 'PENDING').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const topAssignee = useMemo(() => {
    const distribution = new Map<string, number>();
    tasks.forEach((task) => {
      const assigneeId = getAssignedUserId(task);
      if (!assigneeId) return;
      distribution.set(assigneeId, (distribution.get(assigneeId) || 0) + 1);
    });

    let topUserId = '';
    let topCount = 0;
    distribution.forEach((count, userId) => {
      if (count > topCount) {
        topCount = count;
        topUserId = userId;
      }
    });

    return {
      label: topUserId ? employeeNameById.get(topUserId) || topUserId : 'N/A',
      count: topCount,
    };
  }, [employeeNameById, tasks]);

  const comments =
    (commentsResponse?.data as { taskId?: string; comments?: Array<{ comment?: string; created_at?: string; createdAt?: string }> } | undefined)
      ?.comments || [];

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveTaskForComments(null);
    setCommentText('');
    setSubmitError(null);
    setFormData(emptyForm);
  };

  const openCreateTaskModal = () => {
    setEditingId(null);
    setActiveTaskForComments(null);
    setCommentText('');
    setSubmitError(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('Task title is required.');
      return;
    }
    if (!formData.assignedTo) {
      setSubmitError('Please assign the task to an employee.');
      return;
    }
    if (!formData.projectId) {
      setSubmitError('Please select a project.');
      return;
    }
    if (!formData.deadline) {
      setSubmitError('Deadline is required.');
      return;
    }

    try {
      if (editingId) {
        await updateTask.mutateAsync({
          id: editingId,
          data: {
            title: formData.title,
            description: formData.description,
            assignedTo: formData.assignedTo,
            priority: formData.priority,
            status: formData.status,
            deadline: formData.deadline,
          },
        });
      } else {
        await createTask.mutateAsync({
          title: formData.title,
          description: formData.description,
          assignedTo: formData.assignedTo,
          projectId: formData.projectId,
          priority: formData.priority,
          deadline: formData.deadline,
        });
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save task.';
      setSubmitError(message);
    }
  };

  const handleEdit = (task: Task) => {
    const taskId = getTaskId(task);
    const assignedTo = getAssignedUserId(task);
    const projectId = getProjectId(task);

    setEditingId(taskId);
    setActiveTaskForComments(taskId);
    setSubmitError(null);
    setCommentText('');
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo,
      projectId,
      priority: task.priority,
      status: task.status,
      deadline: toDateInputValue(getTaskDeadlineValue(task)),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask.mutateAsync(deleteId);
      setDeleteId(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (!activeTaskForComments || !commentText.trim()) return;
    try {
      await addComment.mutateAsync({ taskId: activeTaskForComments, comment: commentText.trim() });
      setCommentText('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={baseStyles.pageContainer}>
      <div className={baseStyles.pageHeader}>
        <div>
          <h1 className={baseStyles.pageTitle}>Task Management</h1>
          <p className={baseStyles.pageSubtitle}>Create, assign, and monitor team tasks with progress visibility across projects.</p>
        </div>
        <ActionButton
          label="Create Task"
          onClick={openCreateTaskModal}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <p className={styles.helperNote}>
        Employees update task progress from the mobile app. Status changes sync here so managers can monitor work distribution and completion rates in real time.
      </p>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Tasks</p>
          <p className={styles.summaryValue}>{totalTasks}</p>
          <p className={styles.summaryHint}>Across active projects</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Completion Rate</p>
          <p className={styles.summaryValue}>{completionRate}%</p>
          <p className={styles.summaryHint}>{completedTasks} completed</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>In Progress</p>
          <p className={styles.summaryValue}>{inProgressTasks}</p>
          <p className={styles.summaryHint}>{pendingTasks} pending</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Top Workload</p>
          <p className={styles.summaryValue}>{topAssignee.label}</p>
          <p className={styles.summaryHint}>{topAssignee.count} assigned tasks</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {prettyStatus(status)}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable<Task>
        data={tasks}
        isLoading={isLoading}
        emptyMessage="No tasks found"
        columns={[
          { header: 'Task', accessor: 'title', width: '17%' },
          {
            header: 'Assigned To',
            accessor: (task) => employeeNameById.get(getAssignedUserId(task)) || task.assignee_name || task.assigneeName || '-',
            width: '14%',
          },
          {
            header: 'Project',
            accessor: (task) => projectNameById.get(getProjectId(task)) || task.project_name || task.projectName || '-',
            width: '14%',
          },
          {
            header: 'Priority',
            accessor: (task) => (
              <span className={styles.badge} style={priorityColor(task.priority)}>
                {task.priority}
              </span>
            ),
            width: '10%',
          },
          {
            header: 'Deadline',
            accessor: (task) => {
              const raw = getTaskDeadlineValue(task);
              if (!raw) return '-';
              const d = new Date(raw);
              return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
            },
            width: '12%',
          },
          {
            header: 'Status',
            accessor: (task) => {
              const taskId = getTaskId(task);
              return (
                <select
                  className={styles.statusSelect}
                  value={task.status}
                  onChange={(e) => handleQuickStatusChange(taskId, e.target.value as TaskStatus)}
                  aria-label={`Change status for ${task.title}`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {prettyStatus(status)}
                    </option>
                  ))}
                </select>
              );
            },
            width: '17%',
          },
          {
            header: 'Actions',
            accessor: (task) => {
              const taskId = getTaskId(task);
              return (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ActionButton
                    onClick={() => handleEdit(task)}
                    icon={Edit}
                    color={ACTION_BUTTON_COLORS.green}
                    tooltip="Edit task"
                    width={ACTION_BUTTON_SIZES.iconOnly.width}
                    height={ACTION_BUTTON_SIZES.iconOnly.height}
                  />
                  <ActionButton
                    onClick={() => handleDelete(taskId)}
                    icon={Trash2}
                    color={ACTION_BUTTON_COLORS.danger}
                    tooltip="Delete task"
                    width={ACTION_BUTTON_SIZES.iconOnly.width}
                    height={ACTION_BUTTON_SIZES.iconOnly.height}
                  />
                  <button
                    className={styles.commentButton}
                    onClick={() => {
                      setActiveTaskForComments(taskId);
                      setIsModalOpen(true);
                    }}
                    title="Collaborate with comments"
                  >
                    <MessageSquare size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Notes
                  </button>
                </div>
              );
            },
            width: '16%',
          },
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Task' : activeTaskForComments ? 'Task Collaboration' : 'Create New Task'}
        size="large"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton
              label="Close"
              onClick={closeModal}
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
            {editingId || !activeTaskForComments ? (
              <ActionButton
                label={editingId ? 'Update' : 'Create'}
                onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
                color={ACTION_BUTTON_COLORS.success}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
                loading={createTask.isPending || updateTask.isPending}
              />
            ) : null}
          </div>
        }
      >
        {(editingId || !activeTaskForComments) && (
          <form onSubmit={handleSubmit}>
            {submitError && <div className={styles.inlineError}>{submitError}</div>}

            <FormField label="Title" required>
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

            <FormField label="Assign To" required>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                required
                disabled={isUsersLoading || employeeOptions.length === 0}
              >
                <option value="">
                  {isUsersLoading
                    ? 'Loading employees...'
                    : employeeOptions.length === 0
                      ? 'No employee accounts available'
                      : 'Select employee'}
                </option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Project" required>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
                disabled={isProjectsLoading || projectOptions.length === 0}
              >
                <option value="">
                  {isProjectsLoading
                    ? 'Loading projects...'
                    : projectOptions.length === 0
                      ? 'No projects available'
                      : 'Select project'}
                </option>
                {projectOptions.map((project: ProjectOption) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Priority" required>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  required
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status" required>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  required
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {prettyStatus(status)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Deadline" required>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </FormField>
            </div>
          </form>
        )}

        {activeTaskForComments && (
          <>
            <FormField label="Team Comment">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Share an update, blocker, or handoff note..."
              />
            </FormField>

            <div style={{ marginBottom: '10px' }}>
              <ActionButton
                label="Add Comment"
                onClick={handleAddComment}
                color={ACTION_BUTTON_COLORS.info}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
                loading={addComment.isPending}
              />
            </div>

            <div className={styles.commentsPanel}>
              {isCommentsLoading && <p>Loading comments...</p>}
              {!isCommentsLoading && comments.length === 0 && <p>No comments yet. Start collaboration here.</p>}
              {!isCommentsLoading &&
                comments.map((comment, index) => (
                  <div key={`${comment.created_at || comment.createdAt || 'comment'}-${index}`} className={styles.commentItem}>
                    <p className={styles.commentMeta}>
                      {comment.created_at || comment.createdAt
                        ? new Date(comment.created_at || comment.createdAt || '').toLocaleString()
                        : 'Recent update'}
                    </p>
                    <p className={styles.commentText}>{comment.comment || '-'}</p>
                  </div>
                ))}
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}