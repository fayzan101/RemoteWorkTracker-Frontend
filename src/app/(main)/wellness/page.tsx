'use client';

import { useMemo, useState } from 'react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/hooks';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useWellnessListAll } from '@/services/wellness/useWellness';
import { MOOD_OPTIONS } from '@/types/wellness';
import type { WellnessLog, WellnessFilters } from '@/types';

interface WellnessTableRow {
  logId: string;
  userId: string;
  name: string | null;
  date: string;
  mood: WellnessLog['mood'];
  energyLevel: number | null;
  notes: string | null;
  createdAt: string;
}

const defaultFilters: WellnessFilters = {
  startDate: undefined,
  endDate: undefined,
  mood: undefined,
  minEnergy: undefined,
  maxEnergy: undefined,
};

function getLogId(log: WellnessLog) {
  return log.logId || log.log_id || '';
}

function getUserId(log: WellnessLog) {
  return log.userId || log.user_id || '';
}

function getEnergyLevel(log: WellnessLog) {
  const value = log.energyLevel ?? log.energy_level;
  return typeof value === 'number' ? value : null;
}

function getCreatedAt(log: WellnessLog) {
  return log.createdAt || log.created_at || '';
}

function toTableRow(log: WellnessLog): WellnessTableRow {
  return {
    logId: getLogId(log),
    userId: getUserId(log),
    name: log.name ?? null,
    date: log.date,
    mood: log.mood,
    energyLevel: getEnergyLevel(log),
    notes: log.notes ?? null,
    createdAt: getCreatedAt(log),
  };
}

function formatDate(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function WellnessPage() {
  const { organizationId } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [draftFilters, setDraftFilters] = useState<WellnessFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<WellnessFilters>(defaultFilters);

  const queryFilters = useMemo<WellnessFilters>(
    () => ({
      ...appliedFilters,
      page,
      limit,
      organizationId: organizationId || undefined,
    }),
    [appliedFilters, page, limit, organizationId],
  );

  const { data: response, isLoading } = useWellnessListAll(queryFilters);

  const logs = response?.data?.data || [];
  const meta = response?.data?.meta;
  const tableRows = useMemo(() => logs.map(toTableRow), [logs]);

  const moodStats = useMemo(
    () =>
      MOOD_OPTIONS.map((option) => ({
        ...option,
        count: tableRows.filter((row) => row.mood === option.value).length,
      })),
    [tableRows],
  );

  const maxMoodCount = Math.max(...moodStats.map((item) => item.count), 1);

  const averageEnergy = useMemo(() => {
    const energyValues = tableRows
      .map((log) => log.energyLevel)
      .filter((value): value is number => typeof value === 'number');

    if (!energyValues.length) return null;

    const total = energyValues.reduce((sum, current) => sum + current, 0);
    return (total / energyValues.length).toFixed(1);
  }, [tableRows]);

  const lowEnergyCount = useMemo(
    () => tableRows.filter((log) => (log.energyLevel ?? 0) <= 2).length,
    [tableRows],
  );

  const stressedCount = useMemo(
    () => tableRows.filter((log) => log.mood === 'STRESSED' || log.mood === 'VERY_LOW').length,
    [tableRows],
  );

  const latestMood = tableRows[0]?.mood ?? null;

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setPage(1);
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const setEnergyValue = (field: 'minEnergy' | 'maxEnergy', value: string) => {
    const parsed = Number(value);
    setDraftFilters((previous) => ({
      ...previous,
      [field]: value === '' || Number.isNaN(parsed) ? undefined : parsed,
    }));
  };

  const canGoPrevious = page > 1;
  const totalPages = meta?.totalPages || 1;
  const canGoNext = page < totalPages;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Wellness</h1>
          <p className={styles.pageSubtitle}>Mood logs are collected from mobile and visualized here.</p>
        </div>
      </div>

      <div className={styles.featureGridWide}>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Logs on page</div>
          <div className={styles.statTileValue}>{tableRows.length}</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Average energy</div>
          <div className={styles.statTileValue}>{averageEnergy ? `${averageEnergy}/5` : '-'}</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Low energy entries</div>
          <div className={styles.statTileValue}>{lowEnergyCount}</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTileLabel}>Stress signals</div>
          <div className={styles.statTileValue}>{stressedCount}</div>
        </div>
      </div>

      <div className={styles.featureGrid}>
        <div className={styles.panelCard}>
          <div className={styles.panelRow}>
            <div className={styles.panelCardHeader}>
              <div className={styles.panelCardTitle}>Mood distribution</div>
              <p className={styles.panelCardHint}>Current page snapshot from the wellness list endpoint</p>
            </div>
            <div className={styles.panelRowMeta}>
              Latest mood: <span className={styles.panelEmphasis}>{latestMood || '-'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {moodStats.map((item) => {
              const percentage = maxMoodCount ? Math.round((item.count / maxMoodCount) * 100) : 0;
              return (
                <div key={item.value} className={styles.moodRow}>
                  <div className={styles.moodRowTop}>
                    <span>{item.label}</span>
                    <span className={styles.moodRowCount}>{item.count}</span>
                  </div>
                  <div className={styles.moodBarTrack}>
                    <div
                      className={styles.moodBarFill}
                      style={{
                        width: `${percentage}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.panelCard}>
          <div className={styles.panelCardHeader}>
            <div className={styles.panelCardTitle}>Filter wellness logs</div>
            <p className={styles.panelCardHint}>Use the list endpoint to slice the dashboard view.</p>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <FormField label="Start Date">
              <input
                type="date"
                value={draftFilters.startDate || ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value || undefined }))}
              />
            </FormField>
            <FormField label="End Date">
              <input
                type="date"
                value={draftFilters.endDate || ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value || undefined }))}
              />
            </FormField>
            <FormField label="Mood">
              <select
                value={draftFilters.mood || ''}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    mood: (e.target.value || undefined) as WellnessFilters['mood'],
                  }))
                }
              >
                <option value="">All moods</option>
                {MOOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Min Energy">
              <input
                type="number"
                min="1"
                max="5"
                value={draftFilters.minEnergy ?? ''}
                onChange={(e) => setEnergyValue('minEnergy', e.target.value)}
              />
            </FormField>
            <FormField label="Max Energy">
              <input
                type="number"
                min="1"
                max="5"
                value={draftFilters.maxEnergy ?? ''}
                onChange={(e) => setEnergyValue('maxEnergy', e.target.value)}
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
      </div>

      <DataTable<WellnessTableRow>
        data={tableRows}
        columns={[
          {
            header: 'Date',
            accessor: (log) => formatDate(log.date),
            width: '14%',
          },
          {
            header: 'Employee',
            accessor: (log) => log.name || log.userId || '-',
            width: '20%',
          },
          {
            header: 'Mood',
            accessor: 'mood',
            width: '14%',
          },
          {
            header: 'Energy Level',
            accessor: (log) => (log.energyLevel ? `${log.energyLevel}/5` : '-'),
            width: '14%',
          },
          {
            header: 'Notes',
            accessor: (log) => log.notes || '-',
            width: '26%',
          },
          {
            header: 'Logged At',
            accessor: (log) => formatDate(log.createdAt),
            width: '12%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No wellness logs found"
        enablePagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          {meta
            ? `Page ${meta.page} of ${meta.totalPages} • ${meta.totalRecords} total records`
            : `Page ${page} of 1`}
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