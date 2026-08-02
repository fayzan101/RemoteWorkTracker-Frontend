'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Building2, BellRing, ArrowRight, ShieldCheck } from 'lucide-react';
import pageStyles from '../main-pages.module.css';
import styles from './settings-page.module.css';
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
  const [pushPending, setPushPending] = useState(false);

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
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h1 className={pageStyles.pageTitle}>Settings</h1>
          <p className={pageStyles.pageSubtitle}>
            Secure your workspace admin account and manage optional notification delivery.
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconWrap} aria-hidden>
              <KeyRound size={18} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>Admin password</h2>
              <p className={styles.cardHint}>{ORG_USER_PASSWORD_REQUIREMENTS}</p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
            <FormField label="Current password" required>
              <PasswordInput value={oldPassword} onChange={setOldPassword} required />
            </FormField>
            <FormField label="New password" required>
              <PasswordInput value={newPassword} onChange={setNewPassword} required />
            </FormField>
            <FormField label="Confirm new password" required>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword} required />
            </FormField>

            {error ? <div className={pageStyles.formError}>{error}</div> : null}
            {success ? <div className={pageStyles.formSuccess}>{success}</div> : null}

            <div className={styles.actions}>
              <ActionButton
                label={changePassword.isPending ? 'Updating…' : 'Update password'}
                onClick={() => formRef.current?.requestSubmit()}
                color={ACTION_BUTTON_COLORS.primary}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
                disabled={changePassword.isPending}
                loading={changePassword.isPending}
              />
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconWrap} aria-hidden>
              <Building2 size={18} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>Organization</h2>
              <p className={styles.cardHint}>
                Review company details, geo-fences, and workspace identity.
              </p>
            </div>
          </div>
          <Link href="/organization" className={styles.linkRow}>
            <span>Open organization settings</span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconWrap} aria-hidden>
              <BellRing size={18} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>Push notifications</h2>
              <p className={styles.cardHint}>
                Optional device token registration when FCM / web push is configured on the API.
              </p>
            </div>
          </div>

          <form
            id="push-token-form"
            className={styles.form}
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
              setPushPending(true);
              try {
                await notificationsService.registerPushToken(token, 'web');
                setPushSuccess('Push token registered.');
              } catch (err) {
                setPushError(err instanceof Error ? err.message : 'Failed to register token');
              } finally {
                setPushPending(false);
              }
            }}
          >
            <FormField label="Device token" required>
              <input name="token" type="text" placeholder="FCM / web push token" required />
            </FormField>
            {pushError ? <div className={pageStyles.formError}>{pushError}</div> : null}
            {pushSuccess ? <div className={pageStyles.formSuccess}>{pushSuccess}</div> : null}
            <div className={styles.actions}>
              <ActionButton
                label={pushPending ? 'Registering…' : 'Register push token'}
                onClick={() => {
                  const form = document.getElementById('push-token-form') as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
                color={ACTION_BUTTON_COLORS.secondary}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
                loading={pushPending}
                disabled={pushPending}
              />
            </div>
          </form>
        </section>

        <aside className={styles.asideCard}>
          <ShieldCheck size={20} className={styles.asideIcon} aria-hidden />
          <h3 className={styles.asideTitle}>Security tip</h3>
          <p className={styles.asideText}>
            Use a unique admin password and rotate it if anyone with elevated access leaves the
            organization.
          </p>
        </aside>
      </div>
    </div>
  );
}
