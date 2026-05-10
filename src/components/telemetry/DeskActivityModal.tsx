'use client';

import { useTelemetryActivityDetail } from '@/services/telemetry/useTelemetryActivityDetail';
import type { TelemetrySegmentRow } from '@/types/telemetry';
import styles from '@/app/(main)/main-pages.module.css';

function formatDt(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function DeskActivityModal(props: {
  open: boolean;
  organizationId: string | null;
  userId: string | null;
  day: string | null;
  employeeLabel: string;
  onClose: () => void;
}) {
  const { organizationId, userId, day, open, employeeLabel, onClose } = props;

  const { data: payload, isLoading, isError, error } = useTelemetryActivityDetail({
    organizationId,
    userId,
    day,
    enabled: open,
  });

  if (!open) return null;

  const segments: TelemetrySegmentRow[] = payload?.data || [];

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        className={styles.pageContainer}
        style={{
          maxWidth: 960,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          margin: 0,
          background: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          padding: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>Desk activity segments</h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {employeeLabel} · Day {day}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: '8px', border: '1px solid var(--color-border)', padding: '8px 12px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

        {isLoading && <div style={{ marginTop: '20px' }}>Loading segments…</div>}
        {isError && (
          <div style={{ marginTop: '20px', color: '#dc2626' }}>
            {(error as Error)?.message || 'Could not load activity segments'}
          </div>
        )}
        {!isLoading && !isError && segments.length === 0 && (
          <div style={{ marginTop: '20px', color: 'var(--color-text-secondary)' }}>No segments for this day.</div>
        )}
        {!isLoading && !isError && segments.length > 0 && (
          <div style={{ marginTop: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '10px 8px' }}>Time</th>
                  <th style={{ padding: '10px 8px' }}>App</th>
                  <th style={{ padding: '10px 8px' }}>Window / action</th>
                  <th style={{ padding: '10px 8px' }}>Dur</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((row: TelemetrySegmentRow, idx: number) => (
                  <tr key={`${row.createdAt}-${idx}`} style={{ borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>{formatDt(row.createdAt)}</td>
                    <td style={{ padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {row.appLabel || '—'}
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {row.windowTitle || row.action}
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {typeof row.durationSeconds === 'number' ? `${row.durationSeconds}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
