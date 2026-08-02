'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import styles from '../main-pages.module.css';
import { useGetOrganizationById } from '@/services/organization/useOrganization';
import { getOrganizationId } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  useGeoFencesList,
  useCreateGeoFence,
  useDeleteGeoFence,
} from '@/services/attendance/useAttendance';
import type { CreateGeoFencePayload, GeoFence } from '@/types';
import LoadingIndicator from '@/components/LoadingIndicator';

const emptyFence: CreateGeoFencePayload = {
  name: '',
  latitude: 0,
  longitude: 0,
  radiusMeters: 100,
};

export default function OrganizationPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string>('');
  const [fenceForm, setFenceForm] = useState<CreateGeoFencePayload>(emptyFence);
  const [fenceError, setFenceError] = useState<string | null>(null);
  const [fenceSuccess, setFenceSuccess] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrganizationId();
    setOrgId(id || '');
  }, []);

  const { data: response, isLoading } = useGetOrganizationById(orgId);
  const { data: fencesResponse, isLoading: isFencesLoading, isError: isFencesError } = useGeoFencesList();
  const createFence = useCreateGeoFence();
  const deleteFence = useDeleteGeoFence();

  const org = response?.data;
  const fences: GeoFence[] = fencesResponse?.data || [];

  const handleCreateFence = async (e: React.FormEvent) => {
    e.preventDefault();
    setFenceError(null);
    setFenceSuccess(null);
    if (!fenceForm.name.trim()) {
      setFenceError('Name is required.');
      return;
    }
    if (!fenceForm.radiusMeters || fenceForm.radiusMeters <= 0) {
      setFenceError('Radius must be positive.');
      return;
    }
    try {
      await createFence.mutateAsync({
        name: fenceForm.name.trim(),
        latitude: Number(fenceForm.latitude),
        longitude: Number(fenceForm.longitude),
        radiusMeters: Number(fenceForm.radiusMeters),
      });
      setFenceSuccess('Geo fence created.');
      setFenceForm(emptyFence);
    } catch (error) {
      setFenceError(error instanceof Error ? error.message : 'Failed to create geo fence.');
    }
  };

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
        <LoadingIndicator label="Loading organization…" variant="skeleton" rows={4} />
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

      <div className={styles.panelCard} style={{ marginTop: '24px' }}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>Geo fences</div>
          <p className={styles.panelCardHint}>
            Allowed check-in locations (GET/POST/DELETE /api/v1/attendance/geo-fences).
          </p>
        </div>

        {isFencesError && (
          <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
            Failed to load geo fences.
          </div>
        )}

        {isFencesLoading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading fences...</p>
        ) : fences.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>No geo fences yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'grid', gap: '8px' }}>
            {fences.map((fence) => (
              <li
                key={fence.fenceId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{fence.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                    {fence.latitude}, {fence.longitude} · {fence.radiusMeters}m
                  </div>
                </div>
                <ActionButton
                  onClick={() => deleteFence.mutate(fence.fenceId)}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete fence"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                  disabled={deleteFence.isPending}
                />
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreateFence} style={{ display: 'grid', gap: '10px', maxWidth: '480px' }}>
          <FormField label="Name" required>
            <input
              type="text"
              value={fenceForm.name}
              onChange={(e) => setFenceForm({ ...fenceForm, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Latitude" required>
            <input
              type="number"
              step="any"
              value={fenceForm.latitude}
              onChange={(e) => setFenceForm({ ...fenceForm, latitude: Number(e.target.value) })}
              required
            />
          </FormField>
          <FormField label="Longitude" required>
            <input
              type="number"
              step="any"
              value={fenceForm.longitude}
              onChange={(e) => setFenceForm({ ...fenceForm, longitude: Number(e.target.value) })}
              required
            />
          </FormField>
          <FormField label="Radius (meters)" required>
            <input
              type="number"
              min={1}
              value={fenceForm.radiusMeters}
              onChange={(e) => setFenceForm({ ...fenceForm, radiusMeters: Number(e.target.value) })}
              required
            />
          </FormField>
          {fenceError && <div style={{ color: '#dc2626', fontSize: '14px' }}>{fenceError}</div>}
          {fenceSuccess && <div style={{ color: '#16a34a', fontSize: '14px' }}>{fenceSuccess}</div>}
          <button
            type="submit"
            disabled={createFence.isPending}
            style={{
              justifySelf: 'start',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: ACTION_BUTTON_COLORS.success,
              color: '#fff',
              fontWeight: 600,
              cursor: createFence.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createFence.isPending ? 'Creating...' : 'Add geo fence'}
          </button>
        </form>
      </div>
    </div>
  );
}
