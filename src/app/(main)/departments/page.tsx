'use client';

import { useEffect, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/Button';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useDepartmentsList, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/services/departments/useDepartments';
import type { Department, CreateDepartmentPayload } from '@/types';
import { getOrganizationId } from '@/lib/api-client';

export default function DepartmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentPayload>({ name: '' , organizationId: ''});
  const [orgId, setOrgId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: response, isLoading } = useDepartmentsList();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment(editingId || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteDepartment = useDeleteDepartment(deleteId || '');

  const departments = response?.data || [];

  useEffect(() => {
    const id = getOrganizationId();
    setOrgId(id);
    setFormData(prev => ({ ...prev, organizationId: id || '' }));
  }, []);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting form with data:', formData);
      if (editingId) {
        await updateDepartment.mutateAsync(formData);
      } else {
        await createDepartment.mutateAsync(formData);
      }
      setFormData({ name: '', organizationId: orgId || '' });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.departmentId);
    setFormData({ name: dept.name, organizationId: orgId || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', organizationId: orgId || '' });
  };

  const confirmDelete = async () => {
    try {
      if (deleteId) {
        await deleteDepartment.mutateAsync();
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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Departments</h1>
          <p className={styles.pageSubtitle}>Manage organization departments</p>
        </div>
        <ActionButton 
          label="Add Department" 
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

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
              onClick={() => handleSubmit(new Event('submit') as any)}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
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
              message="Are you sure you want to delete this department? This action cannot be undone."
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
