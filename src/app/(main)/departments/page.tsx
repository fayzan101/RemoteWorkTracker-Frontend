'use client';

import { useRef, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  useDepartmentsList,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useReassignUsers,
} from '@/services/departments/useDepartments';
import type { Department } from '@/types';

export default function DepartmentsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string }>({ name: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fromDepartmentId, setFromDepartmentId] = useState('');
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: response, isLoading, isError } = useDepartmentsList();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment(editingId || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteDepartment = useDeleteDepartment(deleteId || '');
  const reassignUsers = useReassignUsers();

  const departments = response?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (editingId) {
        await updateDepartment.mutateAsync({ name: formData.name });
      } else {
        await createDepartment.mutateAsync({ name: formData.name });
      }
      setFormData({ name: '' });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save department.');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.departmentId);
    setFormData({ name: dept.name });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSubmitError(null);
    setFormData({ name: '' });
  };

  const confirmDelete = async () => {
    setDeleteError(null);
    try {
      if (deleteId) {
        await deleteDepartment.mutateAsync();
      }
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete department.');
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
    setDeleteError(null);
  };

  const handleReassign = async () => {
    setReassignError(null);
    setReassignSuccess(null);
    if (!fromDepartmentId || !toDepartmentId) {
      setReassignError('Select both source and destination departments.');
      return;
    }
    if (fromDepartmentId === toDepartmentId) {
      setReassignError('Source and destination must be different.');
      return;
    }
    try {
      await reassignUsers.mutateAsync({ fromDepartmentId, toDepartmentId });
      setReassignSuccess('Users reassigned successfully.');
      setFromDepartmentId('');
      setToDepartmentId('');
    } catch (error) {
      setReassignError(error instanceof Error ? error.message : 'Failed to reassign users.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Departments</h1>
          <p className={styles.pageSubtitle}>Manage organization departments</p>
        </div>
        <ActionButton
          label="Add Department"
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
          Failed to load departments. Please try again.
        </div>
      )}

      <DataTable<Department>
        data={departments}
        columns={[
          { header: 'Department Name', accessor: 'name', width: '50%' },
          {
            header: 'Actions',
            accessor: (dept) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(dept)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit department"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(dept.departmentId as string)}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete department"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '20%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No departments found"
      />

      <div className={styles.panelCard} style={{ marginTop: '24px' }}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>Reassign users</div>
          <p className={styles.panelCardHint}>
            Move all users from one department to another (fromDepartmentId → toDepartmentId).
          </p>
        </div>
        <div style={{ display: 'grid', gap: '12px', maxWidth: '480px' }}>
          <FormField label="From department" required>
            <select value={fromDepartmentId} onChange={(e) => setFromDepartmentId(e.target.value)}>
              <option value="">Select source</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="To department" required>
            <select value={toDepartmentId} onChange={(e) => setToDepartmentId(e.target.value)}>
              <option value="">Select destination</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>
          {reassignError && <div style={{ color: '#dc2626', fontSize: '14px' }}>{reassignError}</div>}
          {reassignSuccess && <div style={{ color: '#16a34a', fontSize: '14px' }}>{reassignSuccess}</div>}
          <ActionButton
            label={reassignUsers.isPending ? 'Reassigning...' : 'Reassign users'}
            onClick={handleReassign}
            color={ACTION_BUTTON_COLORS.primary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            disabled={reassignUsers.isPending}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Department' : 'Create New Department'}
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
          <FormField label="Department Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Department"
        message={
          deleteError ||
          'Are you sure you want to delete this department? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteDepartment.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
