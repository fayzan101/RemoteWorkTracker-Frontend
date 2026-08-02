'use client';

import { useMemo, useRef, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  useComplianceRules,
  useCreateComplianceRule,
  useUpdateComplianceRule,
  useDeleteComplianceRule,
  useComplianceViolations,
  useResolveViolation,
  useAcknowledgeComplianceRule,
} from '@/services/compliance/useCompliance';
import { useUsersList } from '@/services/users/useUsers';
import type { ComplianceRule, CreateComplianceRulePayload, ComplianceViolation } from '@/types/compliance';

const emptyForm: CreateComplianceRulePayload = {
  region: '',
  maxWeeklyHours: 40,
  overtimeAllowed: true,
  minBreakHours: 11,
  description: '',
};

export default function CompliancePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ackRuleId, setAckRuleId] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState('');
  const [ackError, setAckError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateComplianceRulePayload>(emptyForm);

  const { data: rulesResponse, isLoading: isRulesLoading, isError: isRulesError } = useComplianceRules({
    limit: 100,
  });
  const {
    data: violationsResponse,
    isLoading: isViolationsLoading,
    isError: isViolationsError,
  } = useComplianceViolations({ limit: 100 });
  const { data: usersResponse } = useUsersList();

  const createRule = useCreateComplianceRule();
  const updateRule = useUpdateComplianceRule(editingId || '');
  const deleteRule = useDeleteComplianceRule();
  const resolveViolation = useResolveViolation();
  const acknowledgeRule = useAcknowledgeComplianceRule();

  const rules = rulesResponse?.data?.data || [];
  const violations = violationsResponse?.data?.data || [];
  const users = usersResponse?.data || [];

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      const id = user.user_id || user.userId || user.id || '';
      if (!id) continue;
      map.set(id, (user.name || user.email || '').trim() || 'Employee');
    }
    return map;
  }, [users]);

  const ruleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const rule of rules) {
      map.set(rule.ruleId, rule.region || rule.description || 'Rule');
    }
    return map;
  }, [rules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.region.trim()) {
      setSubmitError('Region is required.');
      return;
    }
    if (!formData.maxWeeklyHours || formData.maxWeeklyHours <= 0) {
      setSubmitError('Max weekly hours must be positive.');
      return;
    }
    try {
      if (editingId) {
        await updateRule.mutateAsync(formData);
      } else {
        await createRule.mutateAsync(formData);
      }
      setFormData(emptyForm);
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save rule.');
    }
  };

  const handleEdit = (rule: ComplianceRule) => {
    setEditingId(rule.ruleId);
    setFormData({
      region: rule.region,
      maxWeeklyHours: rule.maxWeeklyHours,
      overtimeAllowed: rule.overtimeAllowed,
      minBreakHours: rule.minBreakHours,
      description: rule.description || '',
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRule.mutateAsync(deleteId);
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
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
          <h1 className={styles.pageTitle}>Compliance</h1>
          <p className={styles.pageSubtitle}>Manage compliance rules and resolve violations</p>
        </div>
        <ActionButton
          label="Add Rule"
          onClick={() => setIsModalOpen(true)}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      {isRulesError && (
        <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load compliance rules.
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Rules</h2>
      <DataTable<ComplianceRule>
        data={rules}
        isLoading={isRulesLoading}
        emptyMessage="No compliance rules found"
        columns={[
          { header: 'Region', accessor: 'region', width: '15%' },
          {
            header: 'Max weekly hours',
            accessor: (r) => String(r.maxWeeklyHours),
            width: '15%',
          },
          {
            header: 'Overtime',
            accessor: (r) => (r.overtimeAllowed ? 'Allowed' : 'Not allowed'),
            width: '15%',
          },
          {
            header: 'Min break (h)',
            accessor: (r) => String(r.minBreakHours),
            width: '12%',
          },
          {
            header: 'Description',
            accessor: (r) => r.description || '-',
            width: '28%',
          },
          {
            header: 'Actions',
            accessor: (rule) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionButton
                  label="Ack"
                  onClick={() => {
                    setAckRuleId(rule.ruleId);
                    setSignatureData('');
                    setAckError(null);
                  }}
                  color={ACTION_BUTTON_COLORS.info}
                  width={ACTION_BUTTON_SIZES.labelOnly.width}
                  height={ACTION_BUTTON_SIZES.labelOnly.height}
                />
                <ActionButton
                  onClick={() => handleEdit(rule)}
                  icon={Edit}
                  color={ACTION_BUTTON_COLORS.green}
                  tooltip="Edit rule"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
                <ActionButton
                  onClick={() => {
                    setDeleteId(rule.ruleId);
                    setIsDeleteDialogOpen(true);
                  }}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete rule"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                />
              </div>
            ),
            width: '20%',
          },
        ]}
      />

      <h2 className={styles.sectionHeading}>Violations</h2>
      {isViolationsError && (
        <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load violations.
        </div>
      )}
      <DataTable<ComplianceViolation>
        data={violations}
        isLoading={isViolationsLoading}
        emptyMessage="No violations found"
        columns={[
          {
            header: 'Employee',
            accessor: (v) => userLabelById.get(v.userId) || 'Unknown employee',
            width: '18%',
          },
          {
            header: 'Rule',
            accessor: (v) => ruleLabelById.get(v.ruleId) || 'Rule',
            width: '16%',
          },
          {
            header: 'Description',
            accessor: (v) => v.description || '—',
            width: '32%',
          },
          {
            header: 'Status',
            accessor: (v) => (
              <span
                className={`${styles.statusBadge} ${
                  v.status === 'RESOLVED' ? styles.statusBadgeSuccess : styles.statusBadgeWarning
                }`}
              >
                {v.status}
              </span>
            ),
            width: '14%',
          },
          {
            header: 'Actions',
            accessor: (v) =>
              v.status !== 'RESOLVED' ? (
                <ActionButton
                  label={resolveViolation.isPending ? '...' : 'Resolve'}
                  onClick={() => resolveViolation.mutate(v.violationId)}
                  color={ACTION_BUTTON_COLORS.success}
                  width={ACTION_BUTTON_SIZES.labelOnly.width}
                  height={ACTION_BUTTON_SIZES.labelOnly.height}
                  disabled={resolveViolation.isPending}
                />
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>Resolved</span>
              ),
            width: '15%',
          },
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Rule' : 'Create Rule'}
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
          <FormField label="Region" required>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Max weekly hours" required>
            <input
              type="number"
              min={1}
              value={formData.maxWeeklyHours}
              onChange={(e) => setFormData({ ...formData, maxWeeklyHours: Number(e.target.value) })}
              required
            />
          </FormField>
          <FormField label="Min break hours">
            <input
              type="number"
              min={0}
              value={formData.minBreakHours ?? 11}
              onChange={(e) => setFormData({ ...formData, minBreakHours: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Overtime allowed">
            <select
              value={formData.overtimeAllowed === false ? 'false' : 'true'}
              onChange={(e) => setFormData({ ...formData, overtimeAllowed: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
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

      <Modal
        isOpen={Boolean(ackRuleId)}
        onClose={() => setAckRuleId(null)}
        title="Acknowledge compliance rule"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton
              label="Cancel"
              onClick={() => setAckRuleId(null)}
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
            <ActionButton
              label={acknowledgeRule.isPending ? '...' : 'Acknowledge'}
              onClick={async () => {
                if (!ackRuleId || !signatureData.trim()) {
                  setAckError('Signature / acknowledgement text is required.');
                  return;
                }
                setAckError(null);
                try {
                  await acknowledgeRule.mutateAsync({
                    id: ackRuleId,
                    signatureData: signatureData.trim(),
                  });
                  setAckRuleId(null);
                  setSignatureData('');
                } catch (err) {
                  setAckError(err instanceof Error ? err.message : 'Acknowledge failed');
                }
              }}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              disabled={acknowledgeRule.isPending}
            />
          </div>
        }
      >
        {ackError && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{ackError}</div>}
        <FormField label="Signature / acknowledgement" required>
          <textarea
            value={signatureData}
            onChange={(e) => setSignatureData(e.target.value)}
            rows={3}
            placeholder="Type your full name to acknowledge this rule"
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Rule"
        message="Are you sure you want to delete this compliance rule?"
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        isLoading={deleteRule.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
