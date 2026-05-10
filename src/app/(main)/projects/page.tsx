'use client';

import { useMemo, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useProjectsList, useCreateProject, useUpdateProject, useDeleteProject } from '@/services/projects/useProjects';
import { useUsersList, useUsersManagers } from '@/services/users/useUsers';
import type { Project, CreateProjectPayload, User } from '@/types';

/** `<input type="date">` only reliably shows a value for `YYYY-MM-DD`. */
function toDateInputValue(value?: string | null): string {
  if (value == null || String(value).trim() === '') return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function ManagerNameCell({
  managerId,
  users,
  managers,
}: {
  managerId: string;
  users: User[];
  managers: User[];
}) {
  const label = useMemo(() => {
    if (!managerId.trim()) return '—';
    const pool = [...users, ...managers];
    const seen = new Set<string>();
    const unique = pool.filter((row) => {
      const id = row.user_id || row.userId || row.id || '';
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const u = unique.find((x) => (x.user_id || x.userId || x.id) === managerId);
    return u?.name?.trim() || u?.email?.trim() || '—';
  }, [managerId, users, managers]);

  return (
    <span style={{ wordBreak: 'break-word' }} title={label !== '—' ? label : undefined}>
      {label}
    </span>
  );
}

export default function ProjectsPage() {
  const { organizationId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProjectPayload>({
    name: '',
    description: '',
    manager_id: '',
    organization_id: organizationId || '',
    start_date: '',
    end_date: '',
  });

  const { data: response, isLoading } = useProjectsList();
  const { data: usersResponse } = useUsersList();
  const { data: managersResponse, isLoading: isManagersLoading, isError: isManagersError } = useUsersManagers(
    organizationId
  );
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(editingId || '');
  const deleteProject = useDeleteProject(deleteId || '');

  const projects = response?.data || [];
  const usersList = usersResponse?.data || [];
  const managersPayload = managersResponse?.data;
  const managersList = Array.isArray(managersPayload) ? managersPayload : [];
  const managerOptions = managersList
    .map((m) => {
      const id = m.userId || m.user_id || m.id || '';
      const label = (m.name || m.email || 'Manager').trim();
      return { id, label };
    })
    .filter((m) => Boolean(m.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const resolvedOrganizationId = (organizationId || formData.organization_id || '').trim();
    const managerId = (formData.manager_id || '').trim();

    if (!formData.name.trim()) {
      setSubmitError('Project name is required.');
      return;
    }
    if (!managerId) {
      setSubmitError('Please select a manager.');
      return;
    }
    if (!resolvedOrganizationId) {
      setSubmitError('Organization ID is required.');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setSubmitError('Start Date and End Date are required.');
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setSubmitError('End Date must be on or after Start Date.');
      return;
    }

    try {
      // Auto-inject organization_id before submission
      const dataToSubmit = {
        ...formData,
        manager_id: managerId,
        organization_id: resolvedOrganizationId,
      };
      
      if (editingId) {
        await updateProject.mutateAsync(dataToSubmit);
      } else {
        await createProject.mutateAsync(dataToSubmit);
      }
      setFormData({
        name: '',
        description: '',
        manager_id: '',
        organization_id: organizationId || '',
        start_date: '',
        end_date: '',
      });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save project.';
      setSubmitError(message);
      console.error('Error:', error);
    }
  };

  const handleEdit = (project: Project) => {
    const pid = project.project_id || (project as { projectId?: string }).projectId || '';
    setEditingId(pid);
    const managerId = project.manager_id || (project as { managerId?: string }).managerId || '';
    const orgId = project.organization_id || (project as { organizationId?: string }).organizationId || '';
    const startRaw = project.start_date || (project as { startDate?: string }).startDate;
    const endRaw = project.end_date || (project as { endDate?: string }).endDate;
    setFormData({
      name: project.name,
      description: project.description || '',
      manager_id: managerId,
      organization_id: orgId,
      start_date: toDateInputValue(startRaw),
      end_date: toDateInputValue(endRaw),
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
        await deleteProject.mutateAsync();
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
    setFormData({
      name: '',
      description: '',
      manager_id: '',
      organization_id: organizationId || '',
      start_date: '',
      end_date: '',
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Projects</h1>
          <p className={styles.pageSubtitle}>Manage organization projects</p>
        </div>
        <ActionButton 
          label="Add Project" 
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <DataTable<Project>
        data={projects}
        columns={[
          { header: 'Project Name', accessor: 'name', width: '20%' },
          { header: 'Description', accessor: 'description', width: '20%' },
          {
            header: 'Manager',
            accessor: (project) => (
              <ManagerNameCell
                managerId={project.manager_id || ''}
                users={usersList}
                managers={managersList as User[]}
              />
            ),
            width: '20%',
          },
          {
            header: 'Start Date',
            accessor: (p) => new Date(p.start_date).toLocaleDateString(),
            width: '15%',
          },
          {
            header: 'End Date',
            accessor: (p) => new Date(p.end_date).toLocaleDateString(),
            width: '15%',
          },
          {
            header: 'Actions',
            accessor: (project) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(project)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit project"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(project.project_id)}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete project"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '15%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No projects found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Project' : 'Create New Project'}
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
          <FormField label="Project Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          <FormField label="Manager" required>
            <select
              value={formData.manager_id}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              required
              disabled={isManagersLoading || managerOptions.length === 0}
            >
              <option value="">
                {isManagersLoading
                  ? 'Loading managers...'
                  : managerOptions.length === 0
                    ? 'No managers available. Add users with a Manager or Admin role.'
                    : 'Select manager'}
              </option>
              {managerOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </FormField>
          {isManagersError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load managers. Check that you are signed in and try again.
            </div>
          )}
          {/* <FormField label="Organization ID" required>
            <input
              type="text"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              required
            />
          </FormField> */}
          <FormField label="Start Date" required>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End Date" required>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteProject.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
