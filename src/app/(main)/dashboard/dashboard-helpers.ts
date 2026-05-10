import type { Goal } from '@/types';
import type { Department } from '@/types';
import type { PayrollRecord } from '@/types';
import type { Project } from '@/types';
import type { Task } from '@/types';
import type { TaskListResponse } from '@/types';
import type { TeamPerformanceRow } from '@/types';
import type { TelemetryDailyRow } from '@/types/telemetry';
import type { TelemetrySegmentRow } from '@/types/telemetry';
import type { User } from '@/types';
import type { WellnessListResponse, WellnessLog } from '@/types';

export function utcTodayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

export function periodDatesUtcDays(days: number): { startDate: string; endDate: string } {
  const endDate = utcTodayYMD();
  const end = new Date(`${endDate}T12:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - (days - 1));
  const startDate = end.toISOString().slice(0, 10);
  return { startDate, endDate };
}

/** First day of current UTC calendar month through today (inclusive end). */
export function periodDatesUtcMonthToDate(): { startDate: string; endDate: string } {
  const endDate = utcTodayYMD();
  const d = new Date(`${endDate}T12:00:00.000Z`);
  const startDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { startDate, endDate };
}

/** Number of UTC calendar days from month start through today (inclusive); use as dashboard `days` for MTD. */
export function utcMonthToDateDayCount(): number {
  const { startDate, endDate } = periodDatesUtcMonthToDate();
  const a = new Date(`${startDate}T12:00:00.000Z`).getTime();
  const b = new Date(`${endDate}T12:00:00.000Z`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

/** Full previous UTC calendar month (for comparison ranges). */
export function periodDatesUtcPreviousCalendarMonth(): { startDate: string; endDate: string } {
  const today = new Date(`${utcTodayYMD()}T12:00:00.000Z`);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const firstPrev = new Date(Date.UTC(y, m - 1, 1));
  const lastPrev = new Date(Date.UTC(y, m, 0));
  return {
    startDate: firstPrev.toISOString().slice(0, 10),
    endDate: lastPrev.toISOString().slice(0, 10),
  };
}

/** Sum daily rows per user for MTD-style rollups. */
export function aggregateDailyRowsByUser(rows: TelemetryDailyRow[]): Map<string, TelemetryDailyRow> {
  const m = new Map<string, TelemetryDailyRow>();
  for (const r of rows) {
    const cur = m.get(r.userId);
    if (!cur) {
      m.set(r.userId, { ...r });
    } else {
      m.set(r.userId, {
        ...cur,
        activeSeconds: cur.activeSeconds + r.activeSeconds,
        idleSeconds: cur.idleSeconds + r.idleSeconds,
        segmentCount: cur.segmentCount + r.segmentCount,
        name: cur.name || r.name,
      });
    }
  }
  return m;
}

export function currentMonthYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function monthStartDateYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** API list payloads: either `T[]` or `{ meta, data: T[] }` inside `data`. */
export function unwrapApiList<T>(apiJson: { data?: unknown } | null | undefined): T[] {
  const inner = apiJson?.data;
  if (Array.isArray(inner)) return inner as T[];
  if (inner && typeof inner === 'object' && Array.isArray((inner as { data?: T[] }).data)) {
    return (inner as { data: T[] }).data;
  }
  return [];
}

export function getUserId(u: User): string {
  return u.user_id || u.userId || u.id || '';
}

export function filterUsersByOrg(users: User[], organizationId: string): User[] {
  return users.filter((u) => (u.organization_id || u.organizationId) === organizationId);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

export function toneGradientForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h}, 70%, 45%), hsl(${h2}, 75%, 52%))`;
}

export function formatDurationSeconds(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return '0m';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function miniBarsFromSeries(values: number[]): number[] {
  if (!values.length) return [20, 24, 22, 28, 26, 30, 32, 28];
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round(20 + (v / max) * 48));
}

/** Map segment into 9:00–17:00 UTC work window for the timeline bar. */
export function segmentBarInWorkWindow(
  createdAt: string,
  durationSeconds: number
): { left: number; width: number; color: string } | null {
  const start = new Date(createdAt);
  const m = start.getUTCHours() * 60 + start.getUTCMinutes();
  const W0 = 9 * 60;
  const W1 = 17 * 60;
  const win = W1 - W0;
  const durMin = durationSeconds / 60;
  if (m + durMin < W0 || m > W1) return null;
  const clipStart = Math.max(m, W0);
  const clipEnd = Math.min(m + durMin, W1);
  const left = ((clipStart - W0) / win) * 100;
  const width = Math.max(((clipEnd - clipStart) / win) * 100, 0.8);
  const label = `${start.getTime()}`;
  const color = hashColor(label);
  return { left, width, color };
}

/**
 * Map segment across the full UTC calendar day (dayYmd) so activity outside 9–17 UTC still renders
 * (fixes empty timelines for teams working outside that window).
 */
export function segmentBarFullDayUtc(
  createdAt: string,
  durationSeconds: number,
  dayYmd: string
): { left: number; width: number; color: string } | null {
  const dayStart = new Date(`${dayYmd}T00:00:00.000Z`).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const t0 = new Date(createdAt).getTime();
  const t1 = t0 + durationSeconds * 1000;
  if (t1 <= dayStart || t0 >= dayEnd) return null;
  const clip0 = Math.max(t0, dayStart);
  const clip1 = Math.min(t1, dayEnd);
  const span = dayEnd - dayStart;
  const left = ((clip0 - dayStart) / span) * 100;
  const width = Math.max(((clip1 - clip0) / span) * 100, 0.12);
  const color = hashColor(String(clip0));
  return { left, width, color };
}

function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 65%, 48%)`;
}

export function appColorForLabel(app: string): string {
  return hashColor(app);
}

export function aggregateAppUsage(segments: TelemetrySegmentRow[]): { name: string; seconds: number }[] {
  const map = new Map<string, number>();
  for (const s of segments) {
    const label = s.appLabel || s.windowTitle || s.action || 'Activity';
    map.set(label, (map.get(label) || 0) + (s.durationSeconds || 0));
  }
  return [...map.entries()]
    .map(([name, seconds]) => ({ name, seconds }))
    .filter((x) => x.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 8);
}

export function departmentName(
  departmentId: string | undefined,
  byId: Map<string, string>
): string {
  if (!departmentId) return '—';
  return byId.get(departmentId) || 'Department';
}

export function projectProgressHeuristic(p: Project): number {
  const start = p.start_date ? new Date(p.start_date).getTime() : NaN;
  const end = p.end_date ? new Date(p.end_date).getTime() : NaN;
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const t = (now - start) / (end - start);
  return Math.max(0, Math.min(100, Math.round(t * 100)));
}

/** Completion % from tasks when any exist for the project; otherwise schedule heuristic. */
export function projectProgressFromTasks(project: Project, tasksForProject: Task[]): number {
  if (!tasksForProject.length) return projectProgressHeuristic(project);
  const done = tasksForProject.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((done / tasksForProject.length) * 100);
}

export function unwrapTasksListPayload(
  apiJson: { data?: TaskListResponse | Task[] } | null | undefined
): Task[] {
  const inner = apiJson?.data as unknown;
  if (!inner) return [];
  if (Array.isArray(inner)) return inner as Task[];
  if (typeof inner === 'object' && Array.isArray((inner as TaskListResponse).data)) {
    return (inner as TaskListResponse).data!;
  }
  return [];
}

export function projectStatusLabel(p: Project): string {
  const end = p.end_date ? new Date(p.end_date) : null;
  const now = new Date();
  if (end && end < now) return 'Overdue';
  const prog = projectProgressHeuristic(p);
  if (prog >= 95) return 'Review';
  if (prog > 0) return 'In Progress';
  return 'Planning';
}

export function sumPayrollMonth(records: PayrollRecord[]): { total: number; overtime: number } {
  let total = 0;
  let overtime = 0;
  for (const r of records) {
    total += Number(r.netPay ?? 0);
    overtime += Number(r.overtime ?? 0);
  }
  return { total, overtime };
}

export function moodSummary(logs: WellnessLog[]): { score: number; happy: number; neutral: number; stressed: number } {
  const good = new Set(['GOOD', 'GREAT', 'FOCUSED']);
  const bad = new Set(['STRESSED', 'VERY_LOW', 'LOW', 'TIRED']);
  let happy = 0;
  let neutral = 0;
  let stressed = 0;
  for (const l of logs) {
    const m = l.mood;
    if (good.has(m)) happy++;
    else if (bad.has(m)) stressed++;
    else neutral++;
  }
  const n = Math.max(logs.length, 1);
  const score = Math.min(100, Math.round((happy * 100 + neutral * 55) / n));
  return { score, happy, neutral, stressed };
}

export function averageActiveHoursByDay(rows: TelemetryDailyRow[], startDate: string, endDate: string): { key: string; hours: number }[] {
  const dayTotals = new Map<string, number>();
  for (const r of rows) {
    if (r.day < startDate || r.day > endDate) continue;
    dayTotals.set(r.day, (dayTotals.get(r.day) || 0) + (r.activeSeconds || 0));
  }
  const keys = [...dayTotals.keys()].sort();
  return keys.map((key) => ({
    key: fmtDayLabel(key),
    hours: Math.round((dayTotals.get(key) || 0) / 360) / 10,
  }));
}

function fmtDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}`;
}

export function rowsForDay(rows: TelemetryDailyRow[], day: string): TelemetryDailyRow[] {
  return rows.filter((r) => r.day === day);
}

export function mergeUserTelemetryToday(
  user: User,
  row: TelemetryDailyRow | undefined,
  perf: TeamPerformanceRow | undefined,
  departmentLabel: string,
  opts?: {
    roleLabel?: string;
    currentApp?: string | null;
  }
): {
  initials: string;
  name: string;
  role: string;
  department: string;
  currentApp: string;
  activeTime: string;
  idleTime: string;
  productivity: number;
  status: 'active' | 'idle' | 'offline';
  tone: string;
} {
  const name = user.name || user.email || 'Member';
  const active = row?.activeSeconds ?? 0;
  const idle = row?.idleSeconds ?? 0;
  const productivity = perf?.completionRate ?? (active + idle > 0 ? Math.round((active / (active + idle)) * 100) : 0);
  const status: 'active' | 'idle' | 'offline' =
    !row || (active === 0 && idle === 0) ? 'offline' : active >= idle ? 'active' : 'idle';
  const roleFromUser =
    opts?.roleLabel?.trim() ||
    (typeof user.role === 'string' && user.role.trim() ? user.role : undefined) ||
    'Member';
  const app =
    (typeof opts?.currentApp === 'string' && opts.currentApp.trim() ? opts.currentApp.trim() : null) || '—';
  return {
    initials: initialsFromName(name),
    name,
    role: roleFromUser,
    department: departmentLabel,
    currentApp: app,
    activeTime: formatDurationSeconds(active),
    idleTime: row ? formatDurationSeconds(idle) : '—',
    productivity,
    status,
    tone: toneGradientForId(getUserId(user)),
  };
}

export function goalsForOrg(goals: Goal[], orgUserIds: Set<string>): Goal[] {
  return goals.filter((g) => {
    const uid = g.user_id || g.userId || '';
    return uid && orgUserIds.has(uid);
  });
}

export function unwrapWellnessEnvelope(apiJson: { data?: unknown } | null | undefined): WellnessLog[] {
  const inner = apiJson?.data as WellnessListResponse | undefined;
  if (inner?.data && Array.isArray(inner.data)) return inner.data;
  return [];
}

export function deriveInsightsFromFacts(
  avgProductivity: number,
  coverage: number,
  unread?: number
): { title: string; description: string; tone: string; bg: string }[] {
  const base = [
    {
      title: 'Team coverage',
      description: `About ${Math.round(coverage * 100)}% of members have agent telemetry in this period.`,
      tone: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
    },
    {
      title: 'Avg completion (tasks)',
      description: `Rolling task completion proxy is around ${avgProductivity}% (from analytics).`,
      tone: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
  ];
  if (typeof unread === 'number') {
    base.push({
      title: 'Notifications',
      description: `You have ${unread} unread notification(s).`,
      tone: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.1)',
    });
  }
  return base;
}
