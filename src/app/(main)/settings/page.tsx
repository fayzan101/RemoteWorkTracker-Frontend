'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import styles from '../main-pages.module.css';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import PasswordInput from '@/components/PasswordInput';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useAuth } from '@/hooks';
import { useChangeAdminPassword } from '@/services/organization/useOrganization';
import { notificationsService } from '@/services/notifications/notifications.service';
import { getOrgUserPasswordError, ORG_USER_PASSWORD_REQUIREMENTS } from '@/lib/passwordPolicy';

export default function SettingsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { organizationId } = useAuth();
  const changePassword = useChangeAdminPassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!organizationId) {
      setError('Organization not found. Please sign in again.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    const policyError = getOrgUserPasswordError(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }

    try {
      await changePassword.mutateAsync({
        organizationId,
        oldPassword,
        newPassword,
      });
      setSuccess('Admin password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <div className={styles.panelCard} style={{ marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
            Change admin password
          </h3>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
            {ORG_USER_PASSWORD_REQUIREMENTS}
          </p>
          <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <FormField label="Current password" required>
              <PasswordInput value={oldPassword} onChange={setOldPassword} required />
            </FormField>
            <FormField label="New password" required>
              <PasswordInput value={newPassword} onChange={setNewPassword} required />
            </FormField>
            <FormField label="Confirm new password" required>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword} required />
            </FormField>
            {error && <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: '#16a34a', fontSize: '14px' }}>{success}</div>}
            <ActionButton
              label={changePassword.isPending ? 'Updating...' : 'Update password'}
              onClick={() => formRef.current?.requestSubmit()}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              disabled={changePassword.isPending}
            />
          </form>
        </div>

        <div className={styles.panelCard}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
            Organization
          </h3>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '12px' }}>
            View organization details and geo-fences from the organization page.
          </p>
          <Link href="/organization" style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
            Go to Organization →
          </Link>
        </div>

        <div className={styles.panelCard} style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
            Push notifications (optional)
          </h3>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '12px' }}>
            Register a device push token with the API when FCM/web push is configured.
          </p>
          <form
            id="push-token-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setPushError(null);
              setPushSuccess(null);
              const fd = new FormData(e.currentTarget);
              const token = String(fd.get('token') || '').trim();
              if (!token) {
                setPushError('Token is required.');
                return;
              }
              try {
                await notificationsService.registerPushToken(token, 'web');
                setPushSuccess('Push token registered.');
              } catch (err) {
                setPushError(err instanceof Error ? err.message : 'Failed to register token');
              }
            }}
            style={{ display: 'grid', gap: 12 }}
          >
            <FormField label="Device token" required>
              <input name="token" type="text" placeholder="FCM / web push token" required />
            </FormField>
            {pushError && <div style={{ color: '#dc2626', fontSize: 14 }}>{pushError}</div>}
            {pushSuccess && <div style={{ color: '#16a34a', fontSize: 14 }}>{pushSuccess}</div>}
            <ActionButton
              label="Register push token"
              onClick={() => {
                const form = document.getElementById('push-token-form') as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              color={ACTION_BUTTON_COLORS.primary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
