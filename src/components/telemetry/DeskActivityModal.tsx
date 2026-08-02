'use client';

import { useTelemetryActivityDetail } from '@/services/telemetry/useTelemetryActivityDetail';
import type { TelemetrySegmentRow } from '@/types/telemetry';
import Modal from '@/components/Modal';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_COLORS, ACTION_BUTTON_SIZES } from '@/constants/actionButtons';
import styles from './DeskActivityModal.module.css';

function formatDt(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatDuration(seconds: number | null | undefined) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
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

  const segments: TelemetrySegmentRow[] = Array.isArray(payload?.data) ? payload!.data : [];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Desk activity"
      size="large"
      actions={
        <ActionButton
          label="Close"
          onClick={onClose}
          color={ACTION_BUTTON_COLORS.secondary}
          width={ACTION_BUTTON_SIZES.labelOnly.width}
          height={ACTION_BUTTON_SIZES.labelOnly.height}
        />
      }
    >
      <p className={styles.subtitle}>
        <span className={styles.employee}>{employeeLabel || 'Employee'}</span>
        {day ? <span className={styles.meta}> · {day} (UTC)</span> : null}
      </p>

      {isLoading && <div className={styles.state}>Loading segments…</div>}
      {isError && (
        <div className={styles.error}>
          {(error as Error)?.message || 'Could not load activity segments'}
        </div>
      )}
      {!isLoading && !isError && segments.length === 0 && (
        <div className={styles.state}>No desk segments recorded for this day.</div>
      )}
      {!isLoading && !isError && segments.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>App</th>
                <th>Window / action</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((row: TelemetrySegmentRow, idx: number) => (
                <tr key={`${row.createdAt}-${idx}`}>
                  <td className={styles.time}>{formatDt(row.createdAt)}</td>
                  <td>{row.appLabel || '—'}</td>
                  <td className={styles.window}>{row.windowTitle || row.action || '—'}</td>
                  <td className={styles.dur}>{formatDuration(row.durationSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
