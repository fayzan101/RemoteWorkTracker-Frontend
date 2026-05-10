'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  Lightbulb,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import baseStyles from '../main-pages.module.css';
import styles from './analytics-page.module.css';
import { useAuth } from '@/hooks';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import {
  useAnalyticsOverview,
  useGenerateAiReport,
  usePortalAiWeeklyReports,
} from '@/services/analytics/useAnalytics';
import { useUsersList } from '@/services/users/useUsers';
import type { User } from '@/types';
import {
  extractLatestAiReportForDashboard,
  parseAiReportBody,
  type DashboardAiInsight,
} from '@/lib/analytics-insights';

function fmtSeconds(total: number) {
  if (!Number.isFinite(total) || total <= 0) return '—';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function pct(x: number) {
  if (!Number.isFinite(x)) return '—';
  return `${Math.round(x * 1000) / 10}%`;
}

function userOptionId(user: User) {
  return user.user_id || user.userId || user.id || '';
}

function extractUsers(usersResponse: unknown): User[] {
  if (!usersResponse || typeof usersResponse !== 'object') return [];
  const outer = usersResponse as { data?: unknown };
  const usersPayload = outer.data;
  if (!usersPayload) return [];
  if (Array.isArray(usersPayload)) return usersPayload as User[];
  const nested = usersPayload as { data?: User[] };
  if (nested.data && Array.isArray(nested.data)) return nested.data;
  return [];
}

type HistoryPoint = { date: string; score: number };

function extractHistorySeries(data: Record<string, unknown> | undefined): HistoryPoint[] {
  if (!data) return [];
  const h = data.history;
  if (!Array.isArray(h)) return [];
  const pts: HistoryPoint[] = [];
  for (const item of h) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const d = typeof row.created_at === 'string' ? row.created_at.slice(0, 10) : '';
    const score = Number(row.productivity_score ?? 0);
    if (d) pts.push({ date: d, score });
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date));
}

function riskTone(label: string | null | undefined): 'ok' | 'mid' | 'high' {
  if (!label) return 'ok';
  if (label.includes('High')) return 'high';
  if (label.includes('Medium')) return 'mid';
  return 'ok';
}

function isSparseTelemetryLabel(q: string | null | undefined): boolean {
  if (!q) return false;
  const s = q.toLowerCase();
  return s.includes('sparse') || s.includes('limited') || s.includes('low coverage');
}

function anomalySeverityClass(sev: string, stylesMod: typeof styles): string {
  const s = sev.toLowerCase();
  if (s.includes('high') || s.includes('critical')) return stylesMod.anomalyHigh;
  if (s.includes('med') || s.includes('medium')) return stylesMod.anomalyMed;
  return stylesMod.anomalyLow;
}

function formatFeatureKey(k: string): string {
  return k.replace(/_/g, ' ');
}

function ProductivityGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 54;
  const cx = 80;
  const cy = 80;
  const stroke = 12;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c * 0.7;
  const gap = c * 0.7 - dash;
  return (
    <div className={styles.gaugeWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160" className={styles.gaugeSvg} aria-hidden>
        <defs>
          <linearGradient id="analyticsGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#analyticsGaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap + c * 0.3}`}
          transform={`rotate(126 ${cx} ${cy})`}
        />
      </svg>
      <div className={styles.gaugeCenter}>
        <span className={styles.gaugeScore}>{Math.round(v)}</span>
        <span className={styles.gaugeHint}>productivity</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { organizationId } = useAuth();
  const [days, setDays] = useState(7);
  const [draftEmployeeId, setDraftEmployeeId] = useState('');
  const [appliedEmployeeId, setAppliedEmployeeId] = useState<string | undefined>(undefined);

  const overviewParams = useMemo(
    () => ({
      organizationId: organizationId || undefined,
      days,
      employeeId: appliedEmployeeId,
    }),
    [organizationId, days, appliedEmployeeId]
  );

  const { data: overview, isLoading, error } = useAnalyticsOverview(overviewParams);
  const {
    data: aiWeeklyRaw,
    isLoading: aiWeeklyLoading,
    error: aiWeeklyError,
    refetch: refetchAiWeekly,
  } = usePortalAiWeeklyReports(appliedEmployeeId, 14);
  const generateAi = useGenerateAiReport();
  const { data: usersResponse } = useUsersList();
  const users = useMemo(() => extractUsers(usersResponse), [usersResponse]);

  const weeklyRecord = aiWeeklyRaw as Record<string, unknown> | undefined;
  const overviewAiData = overview?.aiInsights?.data as Record<string, unknown> | undefined;

  const insightPayload = useMemo(() => {
    if (weeklyRecord && typeof weeklyRecord.latest_report === 'object') return weeklyRecord;
    if (overviewAiData && typeof overviewAiData.latest_report === 'object') return overviewAiData;
    return weeklyRecord ?? overviewAiData;
  }, [weeklyRecord, overviewAiData]);

  const insight = useMemo(
    () => extractLatestAiReportForDashboard(insightPayload),
    [insightPayload]
  );

  const historySeries = useMemo(() => extractHistorySeries(insightPayload), [insightPayload]);

  const maxHistScore = useMemo(
    () => (historySeries.length ? Math.max(...historySeries.map((p) => p.score), 1) : 1),
    [historySeries]
  );

  const historyBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of historySeries) counts.set(p.date, (counts.get(p.date) ?? 0) + 1);
    const dupDates = new Set(
      [...counts.entries()].filter(([, n]) => n > 1).map(([d]) => d)
    );
    const ord = new Map<string, number>();
    return historySeries.map((p, idx) => {
      const o = (ord.get(p.date) ?? 0) + 1;
      ord.set(p.date, o);
      return { ...p, idx, showOrdinal: dupDates.has(p.date), ordinal: o };
    });
  }, [historySeries]);

  const freshReport = generateAi.isSuccess ? (generateAi.data?.report as Record<string, unknown> | undefined) : undefined;
  const displayInsight: DashboardAiInsight | null = useMemo(() => {
    if (freshReport && typeof freshReport === 'object') {
      const eid = typeof freshReport.employee_id === 'string' ? freshReport.employee_id : '';
      if (appliedEmployeeId && eid && eid !== appliedEmployeeId) {
        return insight;
      }
      const parsed = parseAiReportBody(freshReport);
      if (parsed) return parsed;
    }
    return insight;
  }, [freshReport, insight, appliedEmployeeId]);

  if (!organizationId) {
    return <div className={baseStyles.pageContainer}>Please log in to an organization first</div>;
  }

  const facts = overview?.facts;
  const ai = overview?.aiInsights;
  const deskHasSideColumn = Boolean(
    facts &&
      (facts.telemetry.totalActiveSeconds + facts.telemetry.totalIdleSeconds > 0 ||
        facts.viewerDesk ||
        facts.selectedEmployeeDesk)
  );
  return (
    <div className={baseStyles.pageContainer}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Insights</p>
          <h1 className={baseStyles.pageTitle}>Analytics</h1>
          <p className={baseStyles.pageSubtitle}>
            Desk activity from the <strong>agent</strong>. AI blocks are <strong>interpretations</strong> from the
            analytics service — not the same as raw seconds.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarField}>
          <label htmlFor="analytics-days">Period</label>
          <select
            id="analytics-days"
            className={styles.select}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
        <div className={styles.toolbarField}>
          <label htmlFor="analytics-employee">Employee</label>
          <select
            id="analytics-employee"
            className={styles.select}
            value={draftEmployeeId}
            onChange={(e) => setDraftEmployeeId(e.target.value)}
          >
            <option value="">Organization totals only</option>
            {users.map((u) => {
              const id = userOptionId(u);
              if (!id) return null;
              return (
                <option key={id} value={id}>
                  {u.name || u.email || id}
                </option>
              );
            })}
          </select>
        </div>
        <ActionButton
          label="Apply"
          width={120}
          height={40}
          color={ACTION_BUTTON_COLORS.primary}
          onClick={() => setAppliedEmployeeId(draftEmployeeId.trim() || undefined)}
        />
      </div>

      {error && <div className={styles.errorBox}>{(error as Error).message}</div>}

      {isLoading && (
        <p style={{ color: 'var(--color-text-tertiary)' }}>Loading analytics…</p>
      )}

      {!isLoading && facts && (
        <>
          <div className={styles.mainStack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    <Activity size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                    {facts.displayName}
                  </h2>
                  <p className={styles.panelDesc}>{facts.explanation}</p>
                </div>
              </div>
              <p className={styles.metaRow}>
                <code style={{ fontSize: 11 }}>{facts.source}</code> · {facts.period.timezoneNote}
              </p>
              <div
                className={`${styles.deskMetricSection} ${deskHasSideColumn ? styles.deskMetricSectionSplit : ''}`}
              >
                <div className={styles.metricGrid}>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Members</div>
                    <div className={styles.metricValue}>{facts.people.members}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>With agent data</div>
                    <div className={styles.metricValue}>{facts.people.withAgentDataInPeriod}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Active (total)</div>
                    <div className={styles.metricValue}>{fmtSeconds(facts.telemetry.totalActiveSeconds)}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Idle (total)</div>
                    <div className={styles.metricValue}>{fmtSeconds(facts.telemetry.totalIdleSeconds)}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Segments</div>
                    <div className={styles.metricValue}>{facts.telemetry.totalSegments}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Coverage</div>
                    <div className={styles.metricValue}>{pct(facts.telemetry.coverageRatio)}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Projects</div>
                    <div className={styles.metricValue}>{facts.work.projects}</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Open tasks</div>
                    <div className={styles.metricValue}>{facts.work.tasks.openOrActive}</div>
                  </div>
                </div>

                {deskHasSideColumn && (
                  <div>
                    {facts.telemetry.totalActiveSeconds + facts.telemetry.totalIdleSeconds > 0 && (
                      <div className={styles.chartBlock} style={{ marginTop: 0 }}>
                        <div className={styles.chartTitle}>Active vs idle (org period)</div>
                        <div
                          style={{
                            display: 'flex',
                            height: 14,
                            borderRadius: 8,
                            overflow: 'hidden',
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              flex: Math.max(1, facts.telemetry.totalActiveSeconds),
                              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                            }}
                            title="Active"
                          />
                          <div
                            style={{
                              flex: Math.max(1, facts.telemetry.totalIdleSeconds),
                              background: 'var(--color-border)',
                            }}
                            title="Idle"
                          />
                        </div>
                        <div className={styles.metaRow} style={{ marginTop: 8, marginBottom: 0 }}>
                          Active {fmtSeconds(facts.telemetry.totalActiveSeconds)} · Idle{' '}
                          {fmtSeconds(facts.telemetry.totalIdleSeconds)}
                        </div>
                      </div>
                    )}

                    {(facts.viewerDesk || facts.selectedEmployeeDesk) && (
                      <div
                        className={`${styles.deskStripGrid} ${
                          facts.viewerDesk && facts.selectedEmployeeDesk ? styles.deskStripGridDual : ''
                        }`}
                        style={{ marginTop: facts.telemetry.totalActiveSeconds + facts.telemetry.totalIdleSeconds > 0 ? 16 : 0 }}
                      >
                        {facts.viewerDesk && (
                          <div className={styles.deskStrip} style={{ marginTop: 0 }}>
                            <strong>Your desk:</strong> active {fmtSeconds(facts.viewerDesk.activeSeconds)} · idle{' '}
                            {fmtSeconds(facts.viewerDesk.idleSeconds)} · {facts.viewerDesk.personDaysWithData}{' '}
                            day(s) with data
                          </div>
                        )}
                        {facts.selectedEmployeeDesk && (
                          <div className={styles.deskStrip} style={{ marginTop: 0 }}>
                            <strong>Selected employee:</strong> active{' '}
                            {fmtSeconds(facts.selectedEmployeeDesk.totalActiveSeconds)} · idle{' '}
                            {fmtSeconds(facts.selectedEmployeeDesk.totalIdleSeconds)} ·{' '}
                            {facts.selectedEmployeeDesk.personDaysWithData} day(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className={`${styles.panel} ${styles.panelAccent}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    <Brain size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                    {ai?.displayName ?? 'AI productivity assessment'}
                  </h2>
                  <p className={styles.panelDesc}>{ai?.explanation}</p>
                </div>
              </div>

              {!appliedEmployeeId && (
                <div className={styles.emptyState}>
                  <Users size={36} strokeWidth={1.25} style={{ opacity: 0.35, marginBottom: 12 }} />
                  <p>{ai?.unavailableReason ?? 'Select an employee and click Apply to load AI insights.'}</p>
                </div>
              )}

              {appliedEmployeeId && !displayInsight && !ai?.available && (
                <div className={styles.emptyState}>
                  <Sparkles size={36} strokeWidth={1.25} style={{ opacity: 0.35, marginBottom: 12 }} />
                  <p>{ai?.unavailableReason || 'No saved AI report yet for this person.'}</p>
                </div>
              )}

              {appliedEmployeeId && displayInsight && (
                <>
                  <div className={styles.aiTop}>
                    {displayInsight.productivityScore != null ? (
                      <ProductivityGauge value={displayInsight.productivityScore} />
                    ) : (
                      <div
                        className={styles.gaugeWrap}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed var(--color-border)',
                          borderRadius: '50%',
                        }}
                      >
                        <Sparkles size={40} strokeWidth={1} style={{ opacity: 0.35 }} aria-hidden />
                      </div>
                    )}
                    <div style={{ width: '100%' }}>
                      <div className={styles.aiCards}>
                        <div className={styles.miniCard}>
                          <div className={styles.miniCardLabel}>
                            <AlertTriangle size={14} /> Burnout risk
                          </div>
                          <div
                            className={`${styles.miniCardValue} ${
                              riskTone(displayInsight.burnoutRisk) === 'high'
                                ? styles.riskHigh
                                : riskTone(displayInsight.burnoutRisk) === 'mid'
                                  ? styles.riskMid
                                  : styles.riskOk
                            }`}
                          >
                            {displayInsight.burnoutRisk ?? '—'}
                          </div>
                        </div>
                        <div className={styles.miniCard}>
                          <div className={styles.miniCardLabel}>
                            <CalendarDays size={14} /> Delay risk
                          </div>
                          <div
                            className={`${styles.miniCardValue} ${
                              riskTone(displayInsight.delayRisk) === 'high'
                                ? styles.riskHigh
                                : riskTone(displayInsight.delayRisk) === 'mid'
                                  ? styles.riskMid
                                  : styles.riskOk
                            }`}
                          >
                            {displayInsight.delayRisk ?? '—'}
                          </div>
                        </div>
                        <div className={styles.miniCard}>
                          <div className={styles.miniCardLabel}>
                            <Zap size={14} /> Attendance
                          </div>
                          <div className={styles.miniCardValue}>{displayInsight.attendancePattern ?? '—'}</div>
                        </div>
                        {(displayInsight.smartCategory || displayInsight.reliabilityScore != null) && (
                          <div className={styles.miniCard}>
                            <div className={styles.miniCardLabel}>
                              <Sparkles size={14} /> Smart attendance
                            </div>
                            <div className={styles.miniCardValue}>{displayInsight.smartCategory ?? '—'}</div>
                            {displayInsight.reliabilityScore != null && (
                              <>
                                <div className={styles.relBar}>
                                  <div
                                    className={styles.relBarFill}
                                    style={{ width: `${displayInsight.reliabilityScore}%` }}
                                  />
                                </div>
                                <span className={styles.metaRow}>Reliability {displayInsight.reliabilityScore}/100</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(displayInsight.telemetrySignalQuality || displayInsight.presenceConsistency) && (
                    <div className={styles.pillRow} aria-label="Telemetry and presence">
                      {displayInsight.telemetrySignalQuality && (
                        <span
                          className={`${styles.pill} ${
                            isSparseTelemetryLabel(displayInsight.telemetrySignalQuality) ? styles.pillSparse : ''
                          }`}
                        >
                          <Radar size={14} aria-hidden />
                          Signal: {displayInsight.telemetrySignalQuality}
                        </span>
                      )}
                      {displayInsight.presenceConsistency && (
                        <span className={styles.pill}>
                          <Activity size={14} aria-hidden />
                          Presence: {displayInsight.presenceConsistency}
                        </span>
                      )}
                    </div>
                  )}

                  {displayInsight.adaptiveBenchmark && (
                    <div className={styles.subPanel}>
                      <h3 className={styles.subPanelTitle}>
                        <Target size={16} aria-hidden />
                        Personal baseline
                      </h3>
                      <div className={styles.benchGrid}>
                        <div className={styles.benchStat}>
                          <div className={styles.benchStatLabel}>Status</div>
                          <div className={styles.benchStatValue}>{displayInsight.adaptiveBenchmark.status}</div>
                        </div>
                        <div className={styles.benchStat}>
                          <div className={styles.benchStatLabel}>Z-score</div>
                          <div className={styles.benchStatValue}>
                            {Number.isFinite(displayInsight.adaptiveBenchmark.zScore)
                              ? displayInsight.adaptiveBenchmark.zScore.toFixed(2)
                              : '—'}
                          </div>
                        </div>
                        <div className={styles.benchStat}>
                          <div className={styles.benchStatLabel}>Baseline μ</div>
                          <div className={styles.benchStatValue}>
                            {Number.isFinite(displayInsight.adaptiveBenchmark.baselineMean)
                              ? displayInsight.adaptiveBenchmark.baselineMean.toFixed(1)
                              : '—'}
                          </div>
                        </div>
                        <div className={styles.benchStat}>
                          <div className={styles.benchStatLabel}>Baseline σ</div>
                          <div className={styles.benchStatValue}>
                            {Number.isFinite(displayInsight.adaptiveBenchmark.baselineStd)
                              ? displayInsight.adaptiveBenchmark.baselineStd.toFixed(2)
                              : '—'}
                          </div>
                        </div>
                        <div className={styles.benchStat}>
                          <div className={styles.benchStatLabel}>Samples</div>
                          <div className={styles.benchStatValue}>{displayInsight.adaptiveBenchmark.sampleCount}</div>
                        </div>
                      </div>
                      {displayInsight.adaptiveBenchmark.message ? (
                        <p className={styles.benchMessage}>{displayInsight.adaptiveBenchmark.message}</p>
                      ) : null}
                    </div>
                  )}

                  {displayInsight.anomaly && (
                    <div className={styles.subPanel}>
                      <h3 className={styles.subPanelTitle}>
                        <ShieldAlert size={16} aria-hidden />
                        Anomaly check
                      </h3>
                      <span
                        className={`${styles.anomalySeverity} ${anomalySeverityClass(
                          displayInsight.anomaly.severity,
                          styles
                        )}`}
                      >
                        {displayInsight.anomaly.isAnomaly ? 'Flagged' : 'Not flagged'} ·{' '}
                        {displayInsight.anomaly.severity}
                      </span>
                      {displayInsight.anomaly.reasons.length > 0 ? (
                        <ul className={styles.reasonList}>
                          {displayInsight.anomaly.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.benchMessage}>No detailed reasons supplied for this period.</p>
                      )}
                    </div>
                  )}

                  {(displayInsight.smartAlgorithms?.length ||
                    displayInsight.smartClusterId != null ||
                    displayInsight.smartCategoryRank != null ||
                    displayInsight.smartHistoryPoints != null ||
                    (displayInsight.smartFeatures && Object.keys(displayInsight.smartFeatures).length > 0)) && (
                    <div className={styles.subPanel}>
                      <h3 className={styles.subPanelTitle}>
                        <Sparkles size={16} aria-hidden />
                        Smart attendance details
                      </h3>
                      {(displayInsight.smartClusterId != null ||
                        displayInsight.smartCategoryRank != null ||
                        displayInsight.smartHistoryPoints != null) && (
                        <div className={styles.kvRows} style={{ marginBottom: 12 }}>
                          {displayInsight.smartClusterId != null && (
                            <div className={styles.kvRow}>
                              <span className={styles.kvKey}>Cluster</span>
                              <span className={styles.kvVal}>{displayInsight.smartClusterId}</span>
                            </div>
                          )}
                          {displayInsight.smartCategoryRank != null && (
                            <div className={styles.kvRow}>
                              <span className={styles.kvKey}>Category rank</span>
                              <span className={styles.kvVal}>{displayInsight.smartCategoryRank}</span>
                            </div>
                          )}
                          {displayInsight.smartHistoryPoints != null && (
                            <div className={styles.kvRow}>
                              <span className={styles.kvKey}>History points</span>
                              <span className={styles.kvVal}>{displayInsight.smartHistoryPoints}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {displayInsight.smartAlgorithms && displayInsight.smartAlgorithms.length > 0 && (
                        <p className={styles.benchMessage} style={{ marginBottom: 12 }}>
                          <strong>Models:</strong> {displayInsight.smartAlgorithms.join(', ')}
                        </p>
                      )}
                      {displayInsight.smartFeatures && Object.keys(displayInsight.smartFeatures).length > 0 && (
                        <div className={styles.kvRows}>
                          {Object.entries(displayInsight.smartFeatures).map(([k, v]) => (
                            <div key={k} className={styles.kvRow}>
                              <span className={styles.kvKey}>{formatFeatureKey(k)}</span>
                              <span className={styles.kvVal}>{typeof v === 'number' ? String(v) : v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {displayInsight.summary && (
                    <div className={styles.summaryBox}>{displayInsight.summary}</div>
                  )}

                  {displayInsight.recommendations.length > 0 && (
                    <ul className={styles.recList}>
                      {displayInsight.recommendations.map((line, idx) => (
                        <li key={idx} className={styles.recItem}>
                          <Lightbulb className={styles.recIcon} size={18} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {historyBars.length > 0 && (
                    <div className={styles.chartBlock}>
                      <div className={styles.chartTitle}>Productivity across recent reports</div>
                      <div className={styles.bars}>
                        {historyBars.map((p) => (
                          <div key={`${p.date}-${p.idx}`} className={styles.barWrap}>
                            <div
                              className={styles.bar}
                              style={{
                                height: `${Math.max(8, (p.score / maxHistScore) * 100)}%`,
                                opacity: 0.85,
                              }}
                              title={`${p.date}: ${p.score}`}
                            />
                            <span className={styles.barLabel} title={p.date}>
                              {p.date.slice(5)}
                              {p.showOrdinal ? ` ·${p.ordinal}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {appliedEmployeeId && (
                <div className={styles.actions}>
                  <ActionButton
                    label={aiWeeklyLoading ? 'Loading…' : 'Refresh data'}
                    width={160}
                    height={38}
                    color={ACTION_BUTTON_COLORS.secondary}
                    onClick={() => void refetchAiWeekly()}
                  />
                  <ActionButton
                    label={generateAi.isPending ? 'Generating…' : 'Generate new report'}
                    width={200}
                    height={38}
                    color={ACTION_BUTTON_COLORS.primary}
                    onClick={() => appliedEmployeeId && generateAi.mutate(appliedEmployeeId)}
                  />
                </div>
              )}

              {generateAi.isError && (
                <div className={styles.errorBox}>{(generateAi.error as Error).message}</div>
              )}
              {aiWeeklyError && (
                <div className={styles.errorBox}>{(aiWeeklyError as Error).message}</div>
              )}
            </section>
          </div>
        </>
      )}

      {!isLoading && !facts && !error && (
        <p style={{ color: 'var(--color-text-tertiary)' }}>No data yet. Try refresh.</p>
      )}
    </div>
  );
}
