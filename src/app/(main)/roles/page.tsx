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
import { useRolesList, useCreateRole, useUpdateRole, useDeleteRole } from '@/services/roles/useRoles';
import type { Role, CreateRolePayload } from '@/types';

export default function RolesPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateRolePayload>({ name: '', description: '' });

  const { data: response, isLoading, isError } = useRolesList();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(editingId || '');
  const deleteRole = useDeleteRole(deleteId || '');

  const roles = response?.roles || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (editingId) {
        await updateRole.mutateAsync(formData);
      } else {
        await createRole.mutateAsync(formData);
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save role.');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingId(role.role_id);
    setFormData({ name: role.name, description: role.description });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteError(null);
    try {
      if (deleteId) {
        await deleteRole.mutateAsync();
      }
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role.';
      setDeleteError(message);
      toast.error(message);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
    setDeleteError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSubmitError(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Roles</h1>
          <p className={styles.pageSubtitle}>Manage organization roles</p>
        </div>
        <ActionButton
          label="Add Role"
          onClick={() => {
            setSubmitError(null);
            setIsModalOpen(true);
          }}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      {isError && (
        <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load roles. Please try again.
        </div>
      )}

      <DataTable<Role>
        data={roles}
        columns={[
          { header: 'Role Name', accessor: 'name', width: '20%' },
          { header: 'Description', accessor: 'description', width: '60%' },
          {
            header: 'Actions',
            accessor: (role) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(role)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit role"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(role.role_id)}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete role"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '20%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No roles found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Role' : 'Create New Role'}
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
          <FormField label="Role Name" required>
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
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Role"
        message={deleteError || 'Are you sure you want to delete this role? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteRole.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
