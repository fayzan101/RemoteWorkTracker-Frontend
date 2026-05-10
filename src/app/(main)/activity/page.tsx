'use client';

/**
 * Mirrors Attendance aggregates + segment drill-down (same agent telemetry APIs).
 * Kept separate for navigation parity with HR modules.
 */

import { useMemo, useState } from 'react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useAttendanceListAll } from '@/services/attendance/useAttendance';
import { useUsersList } from '@/services/users/useUsers';
import type { AttendanceFilters, AttendanceListMeta, AttendanceLog, AttendanceListResponse, User } from '@/types';
import { DeskActivityModal } from '@/components/telemetry/DeskActivityModal';

interface Row {
  userId: string;
  employeeName: string | null;
  day: string;
  segmentCount: number;
  idleSeconds: number;
  activeSeconds: number;
}

const defaultFilters: AttendanceFilters = { userId: undefined, startDate: undefined, endDate: undefined };

function unwrap(body: unknown) {
  if (!body || typeof body !== 'object') return undefined;
  return (body as { data?: unknown }).data;
}

function normalize(payload: unknown) {
  if (!payload)
    return { logs: [] as AttendanceLog[], meta: undefined as AttendanceListMeta | undefined };

  if (Array.isArray(payload)) return { logs: payload as AttendanceLog[], meta: undefined };

  const p = payload as AttendanceListResponse & Record<string, unknown>;

  const logs =
    (Array.isArray(p.attendanceLogs) && (p.attendanceLogs as AttendanceLog[])) ||
    (Array.isArray(p.data) && (p.data as AttendanceLog[])) ||
    [];

  const metaRaw = (p.meta as AttendanceListMeta | undefined) || undefined;
  return { logs, meta: metaRaw };
}

function extractUsers(usersResponse: unknown): User[] {
  if (!usersResponse || typeof usersResponse !== 'object') return [];
  const outer = usersResponse as { data?: unknown };
  const payload = outer.data;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as User[];
  const nested = payload as { data?: User[] };
  if (nested.data && Array.isArray(nested.data)) return nested.data;
  return [];
}

function dayCol(log: AttendanceLog): string {
  if (typeof log.day === 'string' && log.day.trim()) return log.day;
  const t = log.checkIn || log.check_in || '';
  return t ? new Date(t).toISOString().slice(0, 10) : '—';
}

function toRow(log: AttendanceLog): Row {
  return {
    userId: log.userId || log.user_id || '',
    employeeName: log.name ?? null,
    day: dayCol(log),
    segmentCount: typeof log.segmentCount === 'number' ? log.segmentCount : log.segment_count || 0,
    idleSeconds: typeof log.idleSeconds === 'number' ? log.idleSeconds : log.idle_seconds || 0,
    activeSeconds:
      typeof log.activeSeconds === 'number'
        ? log.activeSeconds
        : typeof log.worked_hours === 'number'
          ? Math.round(log.worked_hours * 3600)
          : 0,
  };
}

function uid(u: User) {
  return u.user_id || u.userId || u.id || '';
}

export default function ActivityPage() {
  const { organizationId } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [draftFilters, setDraftFilters] = useState<AttendanceFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AttendanceFilters>(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [modalDay, setModalDay] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState('');

  const queryFilters = useMemo(
    () => ({
      ...appliedFilters,
      page,
      limit,
      organizationId: organizationId || undefined,
    }),
    [appliedFilters, limit, organizationId, page],
  );

  const { data: apiBody, isLoading } = useAttendanceListAll(queryFilters);
  const { data: usersResp } = useUsersList();
  const users = useMemo(() => extractUsers(usersResp), [usersResp]);

  const normalized = useMemo(() => normalize(unwrap(apiBody) ?? apiBody), [apiBody]);
  const rows = useMemo(() => normalized.logs.map(toRow), [normalized.logs]);

  const totalPages = normalized.meta?.totalPages ?? Math.max(1, Math.ceil((normalized.meta?.totalRecords ?? rows.length) / limit));
  const visible = useMemo(() => {
    if (normalized.meta) return rows;
    const s = (page - 1) * limit;
    return rows.slice(s, s + limit);
  }, [limit, normalized.meta, page, rows]);

  if (!organizationId) {
    return (
      <div className={styles.pageContainer}>
        <p>Set an organization context (sign-in) to browse agent-derived activity aggregates.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <DeskActivityModal
        open={modalOpen}
        organizationId={organizationId}
        userId={modalUserId}
        day={modalDay}
        employeeLabel={modalLabel}
        onClose={() => setModalOpen(false)}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Activity</h1>
          <p className={styles.pageSubtitle}>
            Per-employee daily buckets from paired desktop agents. Use Detail to inspect window/App segments stored in{' '}
            <code style={{ fontSize: '12px' }}>activity_logs</code>.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'grid', gap: '10px', maxWidth: 520 }}>
        <FormField label="Employee">
          <select
            value={draftFilters.userId || ''}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, userId: e.target.value || undefined }))
            }
          >
            <option value="">All</option>
            {users.map((u) => (
              <option key={uid(u)} value={uid(u)}>
                {u.name || uid(u)}
              </option>
            ))}
          </select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FormField label="Start">
            <input
              type="date"
              value={draftFilters.startDate || ''}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, startDate: e.target.value || undefined }))
              }
            />
          </FormField>
          <FormField label="End">
            <input
              type="date"
              value={draftFilters.endDate || ''}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, endDate: e.target.value || undefined }))
              }
            />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton
            label="Apply"
            onClick={() => {
              setPage(1);
              setAppliedFilters({ ...draftFilters });
            }}
            color={ACTION_BUTTON_COLORS.success}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
          />
          <ActionButton
            label="Reset"
            onClick={() => {
              setPage(1);
              setDraftFilters(defaultFilters);
              setAppliedFilters(defaultFilters);
            }}
            color={ACTION_BUTTON_COLORS.secondary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
          />
        </div>
      </div>

      <DataTable<Row>
        data={visible}
        columns={[
          { header: 'Employee', accessor: (r) => r.employeeName || r.userId },
          { header: 'UTC day', accessor: 'day' },
          { header: 'Segments', accessor: 'segmentCount' },
          {
            header: 'Active ∑',
            accessor: (r) => `${(r.activeSeconds / 3600).toFixed(2)} h`,
          },
          {
            header: ' ',
            accessor: (r) => (
              <button
                type="button"
                disabled={r.segmentCount === 0 || r.day === '—'}
                onClick={() => {
                  setModalLabel(r.employeeName || r.userId);
                  setModalUserId(r.userId);
                  setModalDay(r.day);
                  setModalOpen(true);
                }}
              >
                Segments…
              </button>
            ),
          },
        ]}
        emptyMessage="No agent activity in this filter window."
        isLoading={isLoading}
        enablePagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ color: '#6b7280' }}>
          Page {page} / {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
