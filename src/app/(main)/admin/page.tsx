'use client';

import { useState } from 'react';
import styles from '../main-pages.module.css';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import ActionButton from '@/components/ActionButton';

export default function AdminOrganizationPage() {
  const { organizationId } = useAuth();

  if (!organizationId) {
    return <div className={styles.pageContainer}>Please log in to an organization first</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Organization Admin</h1>
          <p className={styles.pageSubtitle}>Manage organization settings, users, and departments</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '32px'
      }}>
        {/* Organization Settings Card */}
        <div style={{
          padding: '24px',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          background: 'var(--color-surface)',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Organization Settings
          </h2>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
            Configure organization name, timezone, and other settings
          </p>
          <ActionButton
            label="Edit Settings"
            color={ACTION_BUTTON_COLORS.green}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            onClick={() => alert('Settings page coming soon')}
          />
        </div>

        {/* Users Management Card */}
        <div style={{
          padding: '24px',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          background: 'var(--color-surface)',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            User Management
          </h2>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
            Invite users, manage roles, and permissions
          </p>
          <ActionButton
            label="Manage Users"
            color={ACTION_BUTTON_COLORS.primary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            onClick={() => alert('User management page coming soon')}
          />
        </div>

        {/* Departments Card */}
        <div style={{
          padding: '24px',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          background: 'var(--color-surface)',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Departments
          </h2>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
            Create and manage organization departments
          </p>
          <ActionButton
            label="View Departments"
            color={ACTION_BUTTON_COLORS.primary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            onClick={() => alert('Departments page available')}
          />
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '48px',
        padding: '20px',
        background: 'rgba(37, 99, 235, 0.05)',
        border: '1px solid rgba(37, 99, 235, 0.1)',
        borderRadius: '8px',
        color: 'var(--color-text-secondary)',
        fontSize: '14px'
      }}>
        <strong>Organization ID:</strong> {organizationId}
      </div>
    </div>
  );
}
