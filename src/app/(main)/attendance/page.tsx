'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useAttendanceListAll } from '@/services/attendance/useAttendance';
import { useUsersList } from '@/services/users/useUsers';
import type {
  AttendanceFilters,
  AttendanceListMeta,
  AttendanceLog,
  AttendanceListResponse,
  User,
} from '@/types';
import { DeskActivityModal } from '@/components/telemetry/DeskActivityModal';

interface AttendanceTableRow {
  userId: string;
  employeeName: string | null;
  day: string;
  firstSeen: string | null;
  lastSeen: string | null;
  activeSeconds: number;
  idleSeconds: number;
  segmentCount: number;
  syntheticId: string;
}

const defaultFilters: AttendanceFilters = {
  userId: undefined,
  startDate: undefined,
  endDate: undefined,
};

function unwrapApiBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as { data?: unknown };
  return b.data;
}

function normalizeListPayload(payload: unknown) {
  if (!payload)
    return { logs: [] as AttendanceLog[], meta: undefined as AttendanceListMeta | undefined };

  if (Array.isArray(payload)) {
    return { logs: payload, meta: undefined };
  }

  const p = payload as AttendanceListResponse & Record<string, unknown>;

  const logs =
    (Array.isArray(p.attendanceLogs) && (p.attendanceLogs as AttendanceLog[])) ||
    (Array.isArray(p.data) && (p.data as AttendanceLog[])) ||
    [];

  const metaRaw = (p.meta as AttendanceListMeta | undefined) || undefined;

  return { logs, meta: metaRaw };
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function secondsToLabel(total: number) {
  if (!Number.isFinite(total) || total <= 0) return '—';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function extractDay(log: AttendanceLog): string {
  const d = typeof log.day === 'string' && log.day.trim() ? log.day : undefined;
  if (d) return d;
  const check = log.checkIn || log.check_in || log.created_at || '';
  if (!check) return '—';
  return new Date(check).toISOString().slice(0, 10);
}

function extractActiveSecs(log: AttendanceLog): number {
  const a = log.activeSeconds ?? log.active_seconds;
  if (typeof a === 'number') return Math.max(0, a);
  const wh = log.workedHours ?? log.worked_hours;
  if (typeof wh === 'number') return Math.round(wh * 3600);
  return 0;
}

function extractIdleSecs(log: AttendanceLog): number {
  const i = log.idleSeconds ?? log.idle_seconds;
  if (typeof i === 'number') return Math.max(0, i);
  return 0;
}

function extractSegCount(log: AttendanceLog): number {
  const c = log.segmentCount ?? log.segment_count;
  return typeof c === 'number' ? c : 0;
}

function toTableRow(log: AttendanceLog): AttendanceTableRow {
  const id = log.attendanceId || log.attendance_id || `${log.userId || log.user_id || ''}:${extractDay(log)}`;
  return {
    syntheticId: id,
    userId: log.userId || log.user_id || '',
    employeeName: typeof log.name === 'string' ? log.name : null,
    day: extractDay(log),
    firstSeen: log.checkIn || log.check_in || null,
    lastSeen: log.checkOut || log.check_out || null,
    activeSeconds: extractActiveSecs(log),
    idleSeconds: extractIdleSecs(log),
    segmentCount: extractSegCount(log),
  };
}

function userOptionId(user: User) {
  return user.user_id || user.userId || user.id || '';
}

function extractUsers(usersResponse: unknown) {
  if (!usersResponse || typeof usersResponse !== 'object') return [] as User[];
  const outer = usersResponse as { data?: unknown };
  const usersPayload = outer.data;
  if (!usersPayload) return [] as User[];
  if (Array.isArray(usersPayload)) return usersPayload as User[];
  const nested = usersPayload as { data?: User[] };
  if (nested.data && Array.isArray(nested.data)) return nested.data;
  return [] as User[];
}

export default function AttendancePage() {
  const { organizationId } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [draftFilters, setDraftFilters] = useState<AttendanceFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AttendanceFilters>(defaultFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [modalDay, setModalDay] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState('');

  const queryFilters = useMemo<AttendanceFilters>(
    () => ({
      ...appliedFilters,
      page,
      limit,
      organizationId: organizationId || undefined,
    }),
    [appliedFilters, page, limit, organizationId],
  );

  const { data: apiBody, isLoading } = useAttendanceListAll(queryFilters);
  const { data: usersResponse } = useUsersList();

  const users = useMemo(() => extractUsers(usersResponse), [usersResponse]);

  const normalizedPayload = useMemo(() => {
    const inner = unwrapApiBody(apiBody);
    return normalizeListPayload(inner ?? apiBody);
  }, [apiBody]);

  const rows = useMemo(() => normalizedPayload.logs.map(toTableRow), [normalizedPayload.logs]);

  const filteredRows = useMemo(() => {
    if (normalizedPayload.meta) return rows;
    return rows;
  }, [rows, normalizedPayload.meta]);

  const totalRecords = normalizedPayload.meta?.totalRecords ?? filteredRows.length;
  const totalPages = normalizedPayload.meta?.totalPages ?? Math.max(1, Math.ceil(totalRecords / limit));

  const visibleRows = useMemo(() => {
    if (normalizedPayload.meta) return filteredRows;
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, normalizedPayload.meta, page, limit]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const empCount = useMemo(() => new Set(visibleRows.map((r) => r.userId).filter(Boolean)).size, [visibleRows]);

  const avgIdleMins = useMemo(() => {
    if (!visibleRows.length) return null;
    const m = visibleRows.reduce((acc, r) => acc + r.idleSeconds / visibleRows.length, 0);
    return m / 60;
  }, [visibleRows]);

  const avgActiveMins = useMemo(() => {
    if (!visibleRows.length) return null;
    const m = visibleRows.reduce((acc, r) => acc + r.activeSeconds / visibleRows.length, 0);
    return m / 60;
  }, [visibleRows]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setPage(1);
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const openSegments = (row: AttendanceTableRow) => {
    if (!organizationId || !row.userId || !row.day || row.day === '—') return;
    const label = row.employeeName || row.userId;
    setModalUserId(row.userId);
    setModalDay(row.day);
    setModalLabel(label);
    setModalOpen(true);
  };

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
          <h1 className={styles.pageTitle}>Attendance</h1>
          <p className={styles.pageSubtitle}>
            Derived from Remote Work Agent desk telemetry (activity + idle logs). Requires employees to pair the agent —
            manual check-ins are disabled.
          </p>
        </div>
      </div>

        {/* <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Shown rows</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{visibleRows.length}</div>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Employees in view</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{empCount}</div>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Avg tracked active / row</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>
              {avgActiveMins != null ? `${avgActiveMins.toFixed(1)} min` : '—'}
            </div>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Avg idle / row</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>
              {avgIdleMins != null ? `${avgIdleMins.toFixed(1)} min` : '—'}
            </div>
          </div>
        </div> */}

      <div className={styles.featureGrid}>
        <div className={styles.panelCard}>
          <div className={styles.panelCardHeader}>
            <div className={styles.panelCardTitle}>Filters</div>
            <p className={styles.panelCardHint}>
              Narrow by employee and UTC calendar dates (matching server aggregation windows).
            </p>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <FormField label="Employee">
              <select
                value={draftFilters.userId || ''}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    userId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">All employees</option>
                {users.map((u) => {
                  const uid = userOptionId(u);
                  return (
                    <option key={uid} value={uid}>
                      {u.name || uid || 'Employee'}
                    </option>
                  );
                })}
              </select>
            </FormField>

            <FormField label="Start Date">
              <input
                type="date"
                value={draftFilters.startDate || ''}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    startDate: event.target.value || undefined,
                  }))
                }
              />
            </FormField>

            <FormField label="End Date">
              <input
                type="date"
                value={draftFilters.endDate || ''}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    endDate: event.target.value || undefined,
                  }))
                }
              />
            </FormField>

            <div className={styles.filterActions}>
              <ActionButton
                label="Apply"
                onClick={handleApplyFilters}
                color={ACTION_BUTTON_COLORS.success}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
              />
              <ActionButton
                label="Reset"
                onClick={handleResetFilters}
                color={ACTION_BUTTON_COLORS.secondary}
                width={ACTION_BUTTON_SIZES.labelOnly.width}
                height={ACTION_BUTTON_SIZES.labelOnly.height}
              />
            </div>
          </div>
        </div>

        {!organizationId && (
          <div className={styles.inlineAlert}>
            Select / store an organization in your profile context to load telemetry.
          </div>
        )}
      </div>

      <DataTable<AttendanceTableRow>
        data={visibleRows}
        columns={[
          {
            header: 'Employee',
            accessor: (row) => row.employeeName || row.userId || '-',
            width: '14%',
          },
          {
            header: 'Day (UTC)',
            accessor: 'day',
            width: '9%',
          },
          {
            header: 'First activity',
            accessor: (row) => formatDateTime(row.firstSeen),
            width: '14%',
          },
          {
            header: 'Last activity',
            accessor: (row) => formatDateTime(row.lastSeen),
            width: '14%',
          },
          {
            header: 'Active',
            accessor: (row) => secondsToLabel(row.activeSeconds),
            width: '9%',
          },
          {
            header: 'Idle rep.',
            accessor: (row) => secondsToLabel(row.idleSeconds),
            width: '9%',
          },
          {
            header: 'Segments',
            accessor: 'segmentCount',
            width: '7%',
          },
          {
            header: ' ',
            accessor: (row) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openSegments(row);
                }}
                disabled={row.segmentCount === 0 || !organizationId || !row.userId || row.day === '—'}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  cursor: row.segmentCount ? 'pointer' : 'default',
                  background: '#f8fafc',
                }}
              >
                Detail
              </button>
            ),
            width: '24%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage={
          organizationId
            ? 'No agent telemetry in this window. Pair desktop agents so activity can be collected.'
            : 'Missing organization scope'
        }
        enablePagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          {`Page ${page} of ${totalPages} • ${totalRecords} total records`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton
            label="Previous"
            onClick={() => canGoPrevious && setPage((current) => Math.max(1, current - 1))}
            color={ACTION_BUTTON_COLORS.secondary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            disabled={!canGoPrevious || isLoading}
          />
          <ActionButton
            label="Next"
            onClick={() => canGoNext && setPage((current) => Math.min(totalPages, current + 1))}
            color={ACTION_BUTTON_COLORS.secondary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            disabled={!canGoNext || isLoading}
          />
        </div>
      </div>
    </div>
  );
}
