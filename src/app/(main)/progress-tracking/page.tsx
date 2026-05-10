'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, ShieldAlert, Users } from 'lucide-react';
import baseStyles from '../main-pages.module.css';
import styles from './progress-tracking-page.module.css';
import { useAuth } from '@/hooks';
import { unwrapApiList } from '@/app/(main)/dashboard/dashboard-helpers';
import { useGoalsList } from '@/services/goals/useGoals';
import { useTasksList } from '@/services/tasks/useTasks';
import { useUsersList } from '@/services/users/useUsers';
import { useProductivityReport, useTeamPerformanceReport } from '@/services/analytics/useAnalytics';
import type { AnalyticsReportFilters, Goal, ProductivityRow, Task, TeamPerformanceRow, User } from '@/types';

type WindowKey = '7d' | '30d';

type EmployeeSnapshot = {
  userId: string;
  label: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  goalProgress: number;
  productivityScore: number;
  overdueTasks: number;
  attention: 'positive' | 'warning' | 'danger';
  trendDelta: number;
  trendLabel: string;
};

const WINDOW_LABELS: Record<WindowKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getWindowRange(windowKey: WindowKey) {
  const end = new Date();
  const start = new Date(end);
  const span = windowKey === '7d' ? 7 : 30;
  start.setDate(end.getDate() - (span - 1));
  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
    label: WINDOW_LABELS[windowKey],
    span,
  };
}

function getPreviousRange(startDate: string, span: number) {
  const currentStart = new Date(`${startDate}T00:00:00`);
  const end = new Date(currentStart);
  end.setDate(currentStart.getDate() - 1);
  const start = new Date(end);
  start.setDate(end.getDate() - (span - 1));
  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  };
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatSigned(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}`;
}

function getUserId(user: User) {
  return user.user_id || user.userId || user.id || '';
}

function getTaskId(task: Task) {
  return task.task_id || task.taskId || '';
}

function getTaskOwnerId(task: Task) {
  return task.assigned_to || task.assignedTo || '';
}

function getGoalOwnerId(goal: Goal) {
  return goal.user_id || goal.userId || '';
}

function isPastDue(deadline?: string) {
  const parsed = parseDate(deadline);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

function isDueSoon(deadline?: string) {
  const parsed = parseDate(deadline);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  return parsed >= today && parsed <= inThreeDays;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function extractResponseRows<T>(rows?: T[]) {
  return Array.isArray(rows) ? rows : [];
}

function severityFromSnapshot(snapshot: Pick<EmployeeSnapshot, 'completionRate' | 'goalProgress' | 'overdueTasks'>) {
  if (snapshot.overdueTasks > 0 || snapshot.completionRate < 60 || snapshot.goalProgress < 50) {
    return 'danger';
  }
  if (snapshot.completionRate < 75 || snapshot.goalProgress < 70) {
    return 'warning';
  }
  return 'positive';
}

function attentionLabel(attention: EmployeeSnapshot['attention']) {
  if (attention === 'positive') return 'On track';
  if (attention === 'warning') return 'Watch list';
  return 'Needs attention';
}

function attentionClass(attention: EmployeeSnapshot['attention']) {
  if (attention === 'positive') return styles.badgePositive;
  if (attention === 'warning') return styles.badgeWarning;
  return styles.badgeDanger;
}

function trendClass(delta: number) {
  if (delta >= 0) return styles.badgePositive;
  return styles.badgeDanger;
}

function trendIcon(delta: number) {
  return delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;
}

function deriveProductivityScore(completionRate: number, goalProgress: number, analyticsScore?: number) {
  if (typeof analyticsScore === 'number') return analyticsScore;
  return Math.round((completionRate * 0.6) + (goalProgress * 0.4));
}

function getRowLabel(userId: string, usersById: Map<string, User>, fallbackTask?: Task) {
  const user = usersById.get(userId);
  if (user) return user.name || user.email || userId;
  return fallbackTask?.assignee_name || fallbackTask?.assigneeName || userId;
}

function getRangeLabel(startDate: string, endDate: string) {
  return `${startDate} to ${endDate}`;
}

export default function ProgressTrackingPage() {
  const { organizationId } = useAuth();
  const [windowKey, setWindowKey] = useState<WindowKey>('7d');

  const currentRange = useMemo(() => getWindowRange(windowKey), [windowKey]);
  const previousRange = useMemo(
    () => getPreviousRange(currentRange.startDate, currentRange.span),
    [currentRange.startDate, currentRange.span]
  );

  const analyticsFilters = useMemo<AnalyticsReportFilters>(
    () => ({ startDate: currentRange.startDate, endDate: currentRange.endDate }),
    [currentRange.endDate, currentRange.startDate]
  );
  const previousAnalyticsFilters = useMemo<AnalyticsReportFilters>(
    () => ({ startDate: previousRange.startDate, endDate: previousRange.endDate }),
    [previousRange.endDate, previousRange.startDate]
  );
  const taskFilters = useMemo(
    () => ({ organizationId: organizationId || undefined, limit: 200 }),
    [organizationId]
  );
  const goalFilters = useMemo(
    () => ({ limit: 200, organizationId: organizationId || undefined }),
    [organizationId]
  );

  const { data: tasksResponse, isLoading: isTasksLoading } = useTasksList(taskFilters);
  const { data: goalsResponse, isLoading: isGoalsLoading } = useGoalsList(goalFilters, {
    enabled: !!organizationId,
  });
  const { data: usersResponse, isLoading: isUsersLoading } = useUsersList();
  const { data: currentTeamPerformance } = useTeamPerformanceReport(analyticsFilters);
  const { data: previousTeamPerformance } = useTeamPerformanceReport(previousAnalyticsFilters);
  const { data: currentProductivity } = useProductivityReport(analyticsFilters);
  const { data: previousProductivity } = useProductivityReport(previousAnalyticsFilters);

  const tasksPayload = tasksResponse?.data;
  const tasks = useMemo(() => {
    if (!tasksPayload) return [] as Task[];
    if (Array.isArray(tasksPayload)) return tasksPayload as Task[];
    if (Array.isArray(tasksPayload.data)) return tasksPayload.data as Task[];
    return [] as Task[];
  }, [tasksPayload]);

  const goals = useMemo(
    () => unwrapApiList<Goal>(goalsResponse as { data?: unknown }),
    [goalsResponse]
  );
  const users = extractResponseRows(usersResponse?.data);
  const usersById = useMemo(() => {
    return new Map(users.map((user) => [getUserId(user), user]).filter(([id]) => Boolean(id)) as Array<[string, User]>);
  }, [users]);

  const teamPerformanceRows = extractResponseRows(currentTeamPerformance?.data);
  const previousTeamPerformanceRows = extractResponseRows(previousTeamPerformance?.data);
  const productivityRows = extractResponseRows(currentProductivity?.data);
  const previousProductivityRows = extractResponseRows(previousProductivity?.data);

  const taskSummaryByUser = useMemo(() => {
    const map = new Map<string, { assigned: number; completed: number; overdue: number; dueSoon: number; sampleTask?: Task }>();

    tasks.forEach((task) => {
      const userId = getTaskOwnerId(task);
      if (!userId) return;
      const current = map.get(userId) || { assigned: 0, completed: 0, overdue: 0, dueSoon: 0 };
      current.assigned += 1;
      if (task.status === 'COMPLETED') current.completed += 1;
      if (isPastDue(task.deadline) && task.status !== 'COMPLETED') current.overdue += 1;
      if (isDueSoon(task.deadline) && task.status !== 'COMPLETED') current.dueSoon += 1;
      if (!current.sampleTask) current.sampleTask = task;
      map.set(userId, current);
    });

    return map;
  }, [tasks]);

  const goalsSummaryByUser = useMemo(() => {
    const map = new Map<string, { total: number; averageProgress: number; atRisk: number }>();

    goals.forEach((goal) => {
      const userId = getGoalOwnerId(goal);
      if (!userId) return;
      const current = map.get(userId) || { total: 0, averageProgress: 0, atRisk: 0 };
      current.total += 1;
      current.averageProgress += goal.progress || 0;
      if ((goal.progress || 0) < 50) current.atRisk += 1;
      map.set(userId, current);
    });

    map.forEach((entry) => {
      entry.averageProgress = entry.total ? Math.round(entry.averageProgress / entry.total) : 0;
    });

    return map;
  }, [goals]);

  const currentPerformanceByUser = useMemo(() => new Map(teamPerformanceRows.map((row) => [row.userId, row])), [teamPerformanceRows]);
  const previousPerformanceByUser = useMemo(() => new Map(previousTeamPerformanceRows.map((row) => [row.userId, row])), [previousTeamPerformanceRows]);
  const currentProductivityByUser = useMemo(() => new Map(productivityRows.map((row) => [row.userId, row])), [productivityRows]);
  const previousProductivityByUser = useMemo(() => new Map(previousProductivityRows.map((row) => [row.userId, row])), [previousProductivityRows]);

  const allEmployeeIds = useMemo(() => {
    const ids = new Set<string>();
    users.forEach((user) => {
      const id = getUserId(user);
      if (id) ids.add(id);
    });
    tasks.forEach((task) => {
      const id = getTaskOwnerId(task);
      if (id) ids.add(id);
    });
    goals.forEach((goal) => {
      const id = getGoalOwnerId(goal);
      if (id) ids.add(id);
    });
    teamPerformanceRows.forEach((row) => ids.add(row.userId));
    productivityRows.forEach((row) => ids.add(row.userId));
    return Array.from(ids);
  }, [goals, productivityRows, tasks, teamPerformanceRows, users]);

  const employeeSnapshots = useMemo<EmployeeSnapshot[]>(() => {
    return allEmployeeIds
      .map((userId) => {
        const taskSummary = taskSummaryByUser.get(userId) || { assigned: 0, completed: 0, overdue: 0, dueSoon: 0 };
        const goalSummary = goalsSummaryByUser.get(userId) || { total: 0, averageProgress: 0, atRisk: 0 };
        const currentPerformance = currentPerformanceByUser.get(userId);
        const previousPerformance = previousPerformanceByUser.get(userId);
        const currentProductivityRow = currentProductivityByUser.get(userId);
        const previousProductivityRow = previousProductivityByUser.get(userId);
        const completionRate = typeof currentPerformance?.completionRate === 'number'
          ? currentPerformance.completionRate
          : taskSummary.assigned
            ? Math.round((taskSummary.completed / taskSummary.assigned) * 100)
            : 0;
        const goalProgress = typeof currentPerformance?.goalProgress === 'number'
          ? currentPerformance.goalProgress
          : goalSummary.averageProgress;
        const productivityScore = deriveProductivityScore(
          completionRate,
          goalProgress,
          currentProductivityRow?.productivityScore
        );
        const previousScore = previousProductivityRow?.productivityScore ?? deriveProductivityScore(
          typeof previousPerformance?.completionRate === 'number' ? previousPerformance.completionRate : completionRate,
          typeof previousPerformance?.goalProgress === 'number' ? previousPerformance.goalProgress : goalProgress,
          undefined
        );
        const trendDelta = productivityScore - previousScore;
        const attention = severityFromSnapshot({ completionRate, goalProgress, overdueTasks: taskSummary.overdue }) as 'positive' | 'warning' | 'danger';
        const fallbackTask = taskSummary.sampleTask;

        return {
          userId,
          label: getRowLabel(userId, usersById, fallbackTask),
          tasksAssigned: taskSummary.assigned,
          tasksCompleted: taskSummary.completed,
          completionRate,
          goalProgress,
          productivityScore,
          overdueTasks: taskSummary.overdue,
          attention,
          trendDelta,
          trendLabel: trendDelta >= 0 ? 'Improving vs previous period' : 'Below previous period',
        };
      })
      .sort((left, right) => right.productivityScore - left.productivityScore);
  }, [allEmployeeIds, currentPerformanceByUser, currentProductivityByUser, goalsSummaryByUser, previousPerformanceByUser, previousProductivityByUser, taskSummaryByUser, usersById]);

  const currentCompletionAverage = Math.round(average(employeeSnapshots.map((row) => row.completionRate)));
  const currentGoalAverage = Math.round(average(employeeSnapshots.map((row) => row.goalProgress)));
  const currentProductivityAverage = Math.round(average(employeeSnapshots.map((row) => row.productivityScore)));
  const currentOverdueCount = tasks.filter((task) => isPastDue(task.deadline) && task.status !== 'COMPLETED').length;
  const currentAtRiskGoals = goals.filter((goal) => goal.progress < 50).length;

  const previousCompletionAverage = Math.round(average(
    allEmployeeIds.map((userId) => {
      const row = previousPerformanceByUser.get(userId);
      const taskSummary = taskSummaryByUser.get(userId);
      return typeof row?.completionRate === 'number'
        ? row.completionRate
        : taskSummary?.assigned
          ? Math.round((taskSummary.completed / taskSummary.assigned) * 100)
          : 0;
    })
  ));
  const previousGoalAverage = Math.round(average(
    allEmployeeIds.map((userId) => previousPerformanceByUser.get(userId)?.goalProgress ?? goalsSummaryByUser.get(userId)?.averageProgress ?? 0)
  ));
  const previousProductivityAverage = Math.round(average(
    allEmployeeIds.map((userId) => previousProductivityByUser.get(userId)?.productivityScore ?? 0)
  ));

  const delayedTasks = tasks
    .filter((task) => isPastDue(task.deadline) && task.status !== 'COMPLETED')
    .sort((left, right) => (parseDate(left.deadline)?.getTime() || 0) - (parseDate(right.deadline)?.getTime() || 0))
    .slice(0, 6);

  const dueSoonTasks = tasks
    .filter((task) => isDueSoon(task.deadline) && task.status !== 'COMPLETED')
    .sort((left, right) => (parseDate(left.deadline)?.getTime() || 0) - (parseDate(right.deadline)?.getTime() || 0))
    .slice(0, 4);

  const topPerformer = employeeSnapshots[0];
  const needsAttention = employeeSnapshots.find((row) => row.attention === 'danger');
  const analyticsRowsAvailable = teamPerformanceRows.length > 0 || productivityRows.length > 0;

  const analyticsStatusText = analyticsRowsAvailable
    ? `Backed by ${currentRange.label.toLowerCase()} analytics and live task data. ${currentAtRiskGoals} goals and ${currentOverdueCount} tasks need attention.`
    : `Using live tasks and goals only while analytics data is unavailable. ${currentAtRiskGoals} goals and ${currentOverdueCount} tasks need attention.`;

  const isBusy = isTasksLoading || isGoalsLoading || isUsersLoading;

  if (!organizationId) {
    return <div className={baseStyles.pageContainer}>Please log in to an organization first</div>;
  }

  return (
    <div className={baseStyles.pageContainer}>
      <div className={baseStyles.pageHeader}>
        <div>
          <h1 className={baseStyles.pageTitle}>Progress Tracking</h1>
          <p className={baseStyles.pageSubtitle}>Tracks employee performance through task completion rates and KPI progress.</p>
        </div>
        <div className={styles.windowToggle} aria-label="Progress window selector">
          {(Object.keys(WINDOW_LABELS) as WindowKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.windowButton} ${windowKey === key ? styles.windowButtonActive : ''}`.trim()}
              onClick={() => setWindowKey(key)}
            >
              {WINDOW_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.heroPanel} aria-label="Progress overview">
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.eyebrow}>
              <BarChart3 size={14} /> Productivity control room
            </span>
            <h2 className={styles.heroTitle}>Make performance visible before it turns into missed delivery.</h2>
            <p className={styles.heroCopy}>
              Managers can scan task completion, KPI progress, and overdue work in one place. The view is designed to keep the team accountable while making it easier to spot support needs early.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.heroPill}><Users size={14} /> {employeeSnapshots.length} employees tracked</span>
              <span className={styles.heroPill}><Clock3 size={14} /> {currentRange.label}</span>
              <span className={styles.heroPill}><ShieldAlert size={14} /> Transparency-first monitoring</span>
            </div>
          </div>

          <div className={styles.heroCards}>
            <div className={styles.heroCard}>
              <p className={styles.heroCardLabel}>Top performer</p>
              <p className={styles.heroCardValue}>{topPerformer ? formatPercent(topPerformer.productivityScore) : '--'}</p>
              <p className={styles.heroCardMeta}>
                {topPerformer ? `${topPerformer.label} is leading the current window with ${topPerformer.trendLabel.toLowerCase()}.` : 'No employee data available yet.'}
              </p>
            </div>
            <div className={styles.heroCard}>
              <p className={styles.heroCardLabel}>At-risk pulse</p>
              <p className={styles.heroCardValue}>{needsAttention ? formatPercent(needsAttention.productivityScore) : '--'}</p>
              <p className={styles.heroCardMeta}>
                {needsAttention ? `${needsAttention.label} needs attention on overdue tasks or goal progress.` : 'No employees are currently flagged as high risk.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.noteBanner}>{analyticsStatusText}</div>

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Completion rate</p>
          <p className={styles.metricValue}>{formatPercent(currentCompletionAverage)}</p>
          <p className={styles.metricMeta}>
            {formatSigned(currentCompletionAverage - previousCompletionAverage)} pts versus the previous window.
          </p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>KPI progress</p>
          <p className={styles.metricValue}>{formatPercent(currentGoalAverage)}</p>
          <p className={styles.metricMeta}>
            {formatSigned(currentGoalAverage - previousGoalAverage)} pts versus the previous window.
          </p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Delayed tasks</p>
          <p className={styles.metricValue}>{currentOverdueCount}</p>
          <p className={styles.metricMeta}>Tasks past their deadline and still not completed.</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Productivity score</p>
          <p className={styles.metricValue}>{formatPercent(currentProductivityAverage)}</p>
          <p className={styles.metricMeta}>
            {formatSigned(currentProductivityAverage - previousProductivityAverage)} pts versus the previous window.
          </p>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-label="Employee progress list">
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Employee progress</h2>
              <p className={styles.panelSubtitle}>Task completion and KPI progress blended into one review surface.</p>
            </div>
            <span className={`${styles.badge} ${styles.badgeNeutral}`}>{getRangeLabel(currentRange.startDate, currentRange.endDate)}</span>
          </div>

          <div className={styles.panelBody}>
            {isBusy ? (
              <div className={styles.emptyState}>Loading performance data...</div>
            ) : employeeSnapshots.length === 0 ? (
              <div className={styles.emptyState}>No employee performance data found for this organization.</div>
            ) : (
              <div className={styles.employeeList}>
                {employeeSnapshots.slice(0, 8).map((row) => (
                  <article key={row.userId} className={styles.employeeCard}>
                    <div className={styles.employeeTop}>
                      <div className={styles.employeeIdentity}>
                        <span className={styles.avatar} aria-hidden="true">
                          {row.label.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className={styles.employeeName}>{row.label}</p>
                          <p className={styles.employeeMeta}>Tasks: {row.tasksCompleted}/{row.tasksAssigned} completed</p>
                        </div>
                      </div>
                      <div className={styles.employeeBadgeRow}>
                        <span className={`${styles.badge} ${attentionClass(row.attention)}`}>{attentionLabel(row.attention)}</span>
                        <span className={`${styles.badge} ${trendClass(row.trendDelta)}`}>
                          {trendIcon(row.trendDelta)} {formatSigned(row.trendDelta)} pts
                        </span>
                      </div>
                    </div>

                    <div className={styles.scoreLine}>
                      <div className={styles.scoreRow}>
                        <span>Productivity score</span>
                        <span className={styles.scoreValue}>{formatPercent(row.productivityScore)}</span>
                      </div>
                      <div className={styles.progressTrack} aria-hidden="true">
                        <span className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, row.productivityScore))}%` }} />
                      </div>
                    </div>

                    <div className={styles.secondaryScores}>
                      <div className={styles.secondaryScore}>
                        <p className={styles.secondaryLabel}>Task completion</p>
                        <p className={styles.secondaryValue}>{formatPercent(row.completionRate)}</p>
                      </div>
                      <div className={styles.secondaryScore}>
                        <p className={styles.secondaryLabel}>KPI progress</p>
                        <p className={styles.secondaryValue}>{formatPercent(row.goalProgress)}</p>
                      </div>
                    </div>

                    <div className={styles.secondaryScores}>
                      <div className={styles.secondaryScore}>
                        <p className={styles.secondaryLabel}>Delayed tasks</p>
                        <p className={styles.secondaryValue}>{row.overdueTasks}</p>
                      </div>
                      <div className={styles.secondaryScore}>
                        <p className={styles.secondaryLabel}>Trend note</p>
                        <p className={styles.secondaryValue}>{row.trendLabel}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.panel} aria-label="Delayed task alerts">
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Delayed task alerts</h2>
              <p className={styles.panelSubtitle}>Surface missed deadlines early so managers can unblock work before it slips further.</p>
            </div>
            <span className={`${styles.badge} ${currentOverdueCount > 0 ? styles.badgeDanger : styles.badgePositive}`}>
              <AlertTriangle size={14} /> {currentOverdueCount} overdue
            </span>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.alertList}>
              {delayedTasks.length > 0 ? delayedTasks.map((task) => {
                const ownerId = getTaskOwnerId(task);
                const owner = usersById.get(ownerId);
                const overdueDays = Math.max(1, Math.ceil((Date.now() - (parseDate(task.deadline)?.getTime() || Date.now())) / 86400000));
                return (
                  <article key={getTaskId(task)} className={styles.alertItem}>
                    <div className={styles.alertTop}>
                      <div>
                        <p className={styles.alertTitle}>{task.title}</p>
                        <p className={styles.alertMeta}>
                          {owner?.name || owner?.email || ownerId || 'Unassigned'} • {task.project_name || task.projectName || 'No project'}
                        </p>
                      </div>
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>{overdueDays} day{overdueDays > 1 ? 's' : ''} late</span>
                    </div>
                    <p className={styles.alertDetail}>
                      Deadline {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'not set'} and status is {task.status}.
                    </p>
                  </article>
                );
              }) : (
                <div className={styles.emptyState}>No overdue tasks right now. That is the best kind of alert list.</div>
              )}
            </div>

            <div className={styles.panelBody} style={{ padding: '18px 0 0' }}>
              <h3 className={styles.panelTitle} style={{ fontSize: '16px' }}>Due soon</h3>
              <p className={styles.panelSubtitle}>Tasks due in the next three days need quick follow-up.</p>
              <div className={styles.alertList} style={{ marginTop: '12px' }}>
                {dueSoonTasks.length > 0 ? dueSoonTasks.map((task) => {
                  const ownerId = getTaskOwnerId(task);
                  const owner = usersById.get(ownerId);
                  return (
                    <article key={`${getTaskId(task)}-soon`} className={styles.alertItem}>
                      <div className={styles.alertTop}>
                        <div>
                          <p className={styles.alertTitle}>{task.title}</p>
                          <p className={styles.alertMeta}>{owner?.name || owner?.email || ownerId || 'Unassigned'} • deadline approaching</p>
                        </div>
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Due soon</span>
                      </div>
                    </article>
                  );
                }) : (
                  <div className={styles.emptyState}>Nothing due in the next three days.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.insightGrid}>
        <article className={styles.insightCard}>
          <p className={styles.insightLabel}>Accountability</p>
          <h3 className={styles.insightTitle}>Make ownership visible.</h3>
          <p className={styles.insightText}>When task completion and KPI progress sit side by side, managers can spot blockers quickly and employees can see exactly where work is moving.</p>
        </article>
        <article className={styles.insightCard}>
          <p className={styles.insightLabel}>Transparency</p>
          <h3 className={styles.insightTitle}>Keep the team aligned.</h3>
          <p className={styles.insightText}>The progress window makes performance status readable without digging through multiple screens or separate reports.</p>
        </article>
        <article className={styles.insightCard}>
          <p className={styles.insightLabel}>Manager focus</p>
          <h3 className={styles.insightTitle}>Evaluate trends, not just snapshots.</h3>
          <p className={styles.insightText}>Period comparisons and overdue-task alerts show whether productivity is improving, holding steady, or starting to drift.</p>
        </article>
      </div>
    </div>
  );
}