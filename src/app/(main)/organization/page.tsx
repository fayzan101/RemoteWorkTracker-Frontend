'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from '../main-pages.module.css';
import { useGetOrganizationById } from '@/services/organization/useOrganization';
import { getOrganizationId } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function OrganizationPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string>('');
  
  useEffect(() => {
    const id = getOrganizationId();
    setOrgId(id || '');
  }, []);
  
  const { data: response, isLoading } = useGetOrganizationById(orgId);

  const org = response?.data;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={28} />
          </button>
        <div>
          <h1 className={styles.pageTitle}>Organization</h1>
          <p className={styles.pageSubtitle}>View and manage organization details</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : org ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Organization Name
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                {org.name}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Organization Type
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                {org.organization_type || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Address
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                {org.address || '-'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Admin Email
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                -
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Created At
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                {new Date(org.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Last Updated
              </label>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                {new Date(org.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)' }}>
          No organization found
        </div>
      )}
    </div>
  );
}
