'use client';

import { useMemo, useRef, useState } from 'react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  usePerformanceList,
  useGeneratePerformanceReview,
  useFinalizePerformanceReview,
} from '@/services/performance/usePerformance';
import { useUsersList } from '@/services/users/useUsers';
import type { PerformanceReview } from '@/types/performance';

function currentPeriod() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}

export default function PerformancePage() {
  const generateFormRef = useRef<HTMLFormElement>(null);
  const finalizeFormRef = useRef<HTMLFormElement>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [finalizeReview, setFinalizeReview] = useState<PerformanceReview | null>(null);
  const [userId, setUserId] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const [comments, setComments] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: response, isLoading, isError } = usePerformanceList({ limit: 100 });
  const { data: usersResponse, isLoading: isUsersLoading } = useUsersList();
  const generateReview = useGeneratePerformanceReview();
  const finalizeMutation = useFinalizePerformanceReview();

  const reviews = response?.data?.data || [];
  const users = usersResponse?.data || [];
  const userOptions = useMemo(
    () =>
      users
        .map((user) => {
          const id = user.user_id || user.userId || user.id || '';
          const label = user.name || user.email || id;
          return { id, label };
        })
        .filter((u) => Boolean(u.id)),
    [users]
  );
  const userLabelById = useMemo(
    () => new Map(userOptions.map((u) => [u.id, u.label])),
    [userOptions]
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!userId) {
      setSubmitError('Select a user.');
      return;
    }
    if (!/^\d{4}-Q[1-4]$/.test(period)) {
      setSubmitError('Period must be YYYY-QN (e.g. 2026-Q3).');
      return;
    }
    try {
      await generateReview.mutateAsync({ userId, period });
      setIsGenerateOpen(false);
      setUserId('');
      setPeriod(currentPeriod());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to generate review.');
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeReview) return;
    setSubmitError(null);
    try {
      await finalizeMutation.mutateAsync({
        id: finalizeReview.reviewId,
        payload: {
          comments: comments.trim() || undefined,
          signatureData: signatureData.trim() || undefined,
        },
      });
      setFinalizeReview(null);
      setComments('');
      setSignatureData('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to finalize review.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Performance</h1>
          <p className={styles.pageSubtitle}>Generate and finalize performance reviews</p>
        </div>
        <ActionButton
          label="Generate Review"
          onClick={() => {
            setSubmitError(null);
            setIsGenerateOpen(true);
          }}
          color={ACTION_BUTTON_COLORS.success}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      </div>

      {isError && (
        <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load performance reviews.
        </div>
      )}

      <DataTable<PerformanceReview>
        data={reviews}
        isLoading={isLoading}
        emptyMessage="No performance reviews found"
        columns={[
          {
            header: 'Employee',
            accessor: (r) => userLabelById.get(r.userId) || 'Unknown employee',
            width: '18%',
          },
          { header: 'Period', accessor: 'period', width: '10%' },
          {
            header: 'Overall',
            accessor: (r) => `${r.overallScore}`,
            width: '10%',
          },
          {
            header: 'Attendance',
            accessor: (r) => `${r.attendanceScore}`,
            width: '10%',
          },
          {
            header: 'Tasks',
            accessor: (r) => `${r.taskCompletionScore}`,
            width: '10%',
          },
          {
            header: 'Goals',
            accessor: (r) => `${r.goalProgressScore}`,
            width: '10%',
          },
          { header: 'Status', accessor: (r) => (
            <span className={`${styles.statusBadge} ${r.status === 'FINALIZED' || r.status === 'COMPLETED' ? styles.statusBadgeSuccess : styles.statusBadgeNeutral}`}>
              {r.status}
            </span>
          ), width: '12%' },
          {
            header: 'Actions',
            accessor: (r) =>
              r.status === 'DRAFT' ? (
                <ActionButton
                  label="Finalize"
                  onClick={() => {
                    setSubmitError(null);
                    setFinalizeReview(r);
                    setComments(r.comments || '');
                    setSignatureData('');
                  }}
                  color={ACTION_BUTTON_COLORS.primary}
                  width={ACTION_BUTTON_SIZES.labelOnly.width}
                  height={ACTION_BUTTON_SIZES.labelOnly.height}
                />
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>Finalized</span>
              ),
            width: '14%',
          },
        ]}
      />

      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate performance review"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton
              label="Cancel"
              onClick={() => setIsGenerateOpen(false)}
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
            <ActionButton
              label={generateReview.isPending ? 'Generating...' : 'Generate'}
              onClick={() => generateFormRef.current?.requestSubmit()}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              disabled={generateReview.isPending}
            />
          </div>
        }
      >
        <form ref={generateFormRef} onSubmit={handleGenerate}>
          {submitError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>{submitError}</div>
          )}
          <FormField label="Employee" required>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              disabled={isUsersLoading}
            >
              <option value="">{isUsersLoading ? 'Loading...' : 'Select user'}</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Period (YYYY-QN)" required>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-Q3"
              required
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={!!finalizeReview}
        onClose={() => setFinalizeReview(null)}
        title="Finalize review"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton
              label="Cancel"
              onClick={() => setFinalizeReview(null)}
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
            <ActionButton
              label={finalizeMutation.isPending ? 'Finalizing...' : 'Finalize'}
              onClick={() => finalizeFormRef.current?.requestSubmit()}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              disabled={finalizeMutation.isPending}
            />
          </div>
        }
      >
        <form ref={finalizeFormRef} onSubmit={handleFinalize}>
          {submitError && (
            <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>{submitError}</div>
          )}
          <FormField label="Comments">
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} />
          </FormField>
          <FormField label="Signature (optional text)">
            <input
              type="text"
              value={signatureData}
              onChange={(e) => setSignatureData(e.target.value)}
              placeholder="Type your name as signature"
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
