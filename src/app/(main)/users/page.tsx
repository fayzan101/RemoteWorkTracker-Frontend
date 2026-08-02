'use client';

import { useRef, useMemo, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useUsersList, useCreateUser, useUpdateUser, useDeleteUser } from '@/services/users/useUsers';
import { useRolesList } from '@/services/roles/useRoles';
import { useDepartmentsList } from '@/services/departments/useDepartments';
import type { User, CreateUserPayload } from '@/types';
import { getOrgUserPasswordError, ORG_USER_PASSWORD_REQUIREMENTS } from '@/lib/passwordPolicy';
import { formatPkr } from '@/lib/formatCurrency';
import PasswordInput from '@/components/PasswordInput';

const emptyForm: CreateUserPayload = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  departmentId: '',
  organizationId: '',
  region: '',
  salary: 0,
};

function getUserId(user: User) {
  return user.user_id || user.userId || user.id || '';
}

function getUserRoleId(user: User) {
  return user.role_id || user.roleId || '';
}

function getUserDepartmentId(user: User) {
  return user.department_id || user.departmentId || '';
}

export default function UsersPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { organizationId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Free-typed salary string so number inputs don’t break on partial entry / NaN. */
  const [salaryInput, setSalaryInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [formData, setFormData] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    roleId: '',
    departmentId: '',
    organizationId: organizationId || '',
    region: '',
    salary: 0,
  });

  const { data: response, isLoading } = useUsersList();
  const { data: rolesResponse, isLoading: isRolesLoading, isError: isRolesError } = useRolesList();
  const { data: departmentsResponse, isLoading: isDepsLoading, isError: isDepsError } = useDepartmentsList();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(editingId || '');
  const deleteUser = useDeleteUser(deleteId || '');

  const users = response?.data || [];
  const roles = rolesResponse?.roles || [];
  const departments = departmentsResponse?.data || [];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter && getUserRoleId(user) !== roleFilter) return false;
      if (departmentFilter && getUserDepartmentId(user) !== departmentFilter) return false;
      return true;
    });
  }, [users, roleFilter, departmentFilter]);

  const formatSalary = (salary?: number | string) => {
      if (salary === undefined || salary === null || salary === '') return '-';
      const num = typeof salary === 'string' ? parseFloat(salary) : salary;
      return !Number.isFinite(num) ? '-' : formatPkr(num, { maximumFractionDigits: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate name length
    if (!formData.name || formData.name.length < 3) {
      setSubmitError('Name must be at least 3 characters.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    // Only validate password for new users (not edit mode); matches backend registerUserSchema
    if (!editingId) {
      const pwdErr = getOrgUserPasswordError(formData.password);
      if (pwdErr) {
        setSubmitError(pwdErr);
        return;
      }
    }

    // Validate required fields
    if (!formData.roleId) {
      setSubmitError('Please select a role.');
      return;
    }
    if (!formData.departmentId) {
      setSubmitError('Please select a department.');
      return;
    }
    if (!formData.region || formData.region.length !== 2) {
      setSubmitError('Region must be a 2-letter code (e.g., PK, US).');
      return;
    }
    const salaryNum = parseFloat(salaryInput.replace(/,/g, '').trim());
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      setSubmitError('Enter a valid salary (0 or higher).');
      return;
    }
    if (!organizationId && !formData.organizationId) {
      setSubmitError('Organization ID is required.');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        salary: salaryNum,
        organizationId: organizationId || formData.organizationId,
        ...(!editingId ? { password: formData.password.trim() } : {}),
      };

      if (editingId) {
        // For update, exclude password if it hasn't been changed
        const updateData = {
          name: dataToSubmit.name,
          roleId: dataToSubmit.roleId,
          departmentId: dataToSubmit.departmentId,
          region: dataToSubmit.region,
          salary: salaryNum,
        };
        await updateUser.mutateAsync(updateData as any);
      } else {
        await createUser.mutateAsync(dataToSubmit);
      }
      const resetForm = {
        name: '',
        email: '',
        password: '',
        roleId: '',
        departmentId: '',
        organizationId: organizationId || '',
        region: '',
        salary: 0,
      };
      setFormData(resetForm);
      setSalaryInput('');
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save user.';
      setSubmitError(message);
      console.error('Error:', error);
    }
  };

  const handleEdit = (user: User) => {
    const userId = getUserId(user);
    setEditingId(userId);
    const sal = user.salary;
    let salNum = 0;
    if (typeof sal === 'number' && Number.isFinite(sal)) salNum = sal;
    else if (sal != null && String(sal).trim() !== '') {
      const p = parseFloat(String(sal));
      if (Number.isFinite(p)) salNum = p;
    }
    setSalaryInput(String(salNum));
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
        roleId: user.roleId || user.role_id || '',
        departmentId: user.departmentId || user.department_id || '',
      organizationId: organizationId || '',
      region: user.region || '',
      salary: salNum,
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
        await deleteUser.mutateAsync();
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
    setSalaryInput('');
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      departmentId: '',
      organizationId: organizationId || '',
      region: '',
      salary: 0,
    });
  };

  const openCreateUserModal = () => {
    setEditingId(null);
    setSubmitError(null);
    setSalaryInput('');
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      departmentId: '',
      organizationId: organizationId || '',
      region: '',
      salary: 0,
    });
    setIsModalOpen(true);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSubtitle}>Manage organization users</p>
        </div>
        <ActionButton
          label="Add User"
          onClick={openCreateUserModal}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      <div className={styles.panelCard} style={{ marginBottom: '20px' }}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>Filters</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <FormField label="Role">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department">
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable<User>
        data={filteredUsers}
        columns={[
          { header: 'Name', accessor: 'name', width: '20%' },
          { header: 'Email', accessor: 'email', width: '25%' },
          {
            header: 'Role',
            accessor: (user) =>  rolesResponse?.roles?.find((e) => e.role_id === user.role_id)?.name || '-',
              width: '12%',
          },
            {
              header: 'Department',
              accessor: (user) => departmentsResponse?.data?.find((e) => e.departmentId === user.department_id)?.name || '-',
              width: '12%',
            },
          {
            header: 'Region',
            accessor: (user) => user.region || '-',
              width: '8%',
          },
          {
            header: 'Salary',
              accessor: (user) => formatSalary(user.salary),
              width: '10%',
            },
          {
            header: 'Actions',
            accessor: (user) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ActionButton
                  onClick={() => handleEdit(user)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit user"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => handleDelete(getUserId(user))}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete user"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '20%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit User' : 'Create New User'}
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
          {isRolesError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load roles. Please try again.
            </div>
          )}
          {isDepsError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
              Failed to load departments. Please try again.
            </div>
          )}
          <FormField label="Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Min 3 characters"
              required
            />
          </FormField>
          <FormField label="Email" required>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={editingId ? true : false}
            />
          </FormField>
          {!editingId && (
            <FormField label="Password" required>
              <PasswordInput
                value={formData.password}
                onChange={(password) => setFormData({ ...formData, password })}
                placeholder="e.g. Abcdef1!"
                required
                autoComplete="new-password"
              />
              <p
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: 1.45,
                }}
              >
                {ORG_USER_PASSWORD_REQUIREMENTS}
              </p>
            </FormField>
          )}
          <FormField label="Role" required>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              required
              disabled={isRolesLoading || (rolesResponse?.roles && rolesResponse.roles.length === 0)}
            >
              <option value="">
                {isRolesLoading 
                  ? 'Loading roles...' 
                  : rolesResponse?.roles && rolesResponse.roles.length === 0
                    ? 'No roles available. Please create roles first.'
                    : 'Select role'}
              </option>
              {rolesResponse?.roles?.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department" required>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              required
              disabled={isDepsLoading || (departmentsResponse?.data && departmentsResponse.data.length === 0)}
            >
              <option value="">
                {isDepsLoading 
                  ? 'Loading departments...' 
                  : departmentsResponse?.data && departmentsResponse.data.length === 0
                    ? 'No departments available. Please create departments first.'
                    : 'Select department'}
              </option>
              {departmentsResponse?.data?.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Region" required>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value.toUpperCase() })}
              maxLength={2}
              placeholder="2-letter code (e.g., PK, US)"
              required
            />
          </FormField>
          <FormField label="Salary (PKR)" required>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 55000 (PKR)"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value.replace(/[^\d.]/g, ''))}
              required
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
