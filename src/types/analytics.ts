export interface AnalyticsReportFilters {
  userId?: string;
  projectId?: string;
  teamId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProductivityRow {
  userId: string;
  tasksCompleted: number;
  averageTaskCompletionTime: number;
  productivityScore: number;
}

export interface ProductivityResponse {
  meta?: {
    startDate?: string;
    endDate?: string;
    totalEmployees?: number;
    note?: string;
  };
  data?: ProductivityRow[];
}

export interface TeamPerformanceRow {
  userId: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  attendanceScore: number;
  goalProgress: number;
}

export interface TeamPerformanceResponse {
  meta?: {
    teamId?: string;
    period?: string;
    note?: string;
  };
  data?: TeamPerformanceRow[];
}

/** Portal analytics overview — telemetry facts vs AI interpretation (backend `/api/v1/analytics/overview`). */
export interface AnalyticsOverviewFacts {
  kind: 'telemetry_facts';
  displayName: string;
  explanation: string;
  source: string;
  period: {
    days: number;
    startDate: string;
    endDate: string;
    timezoneNote: string;
  };
  people: {
    members: number;
    withAgentDataInPeriod: number;
  };
  telemetry: {
    personDayRows: number;
    totalActiveSeconds: number;
    totalIdleSeconds: number;
    totalSegments: number;
    coverageRatio: number;
  };
  work: {
    projects: number;
    tasks: {
      total: number;
      openOrActive: number;
    };
  };
  viewerDesk?: {
    userId: string;
    activeSeconds: number;
    idleSeconds: number;
    segmentCount: number;
    personDaysWithData: number;
  };
  unreadNotifications?: number;
  selectedEmployeeDesk?: {
    employeeId: string;
    totalActiveSeconds: number;
    totalIdleSeconds: number;
    totalSegments: number;
    personDaysWithData: number;
  };
}

export interface AnalyticsOverviewAiInsights {
  kind: 'ai_interpretation';
  displayName: string;
  explanation: string;
  source: string;
  available: boolean;
  employeeId: string | null;
  traceId?: string;
  data: Record<string, unknown> | null;
  unavailableReason: string | null;
}

export interface AnalyticsOverviewPayload {
  facts: AnalyticsOverviewFacts;
  aiInsights: AnalyticsOverviewAiInsights;
}

export interface AnalyticsOverviewParams {
  organizationId?: string;
  days?: number;
  employeeId?: string;
  aiReportLimit?: number;
}

/** Backend `GET /api/v1/analytics/ai-reports/:employeeId` — mirrors AI weekly reports payload. */
export type PortalAiWeeklyReportsData = Record<string, unknown>;

/** Backend `POST /api/v1/analytics/ai-report/generate` success `data`. */
export interface PortalAiGenerateResponse {
  report: Record<string, unknown>;
  traceId?: string;
}

export interface AiPerformanceRankingRow {
  employee_id: string;
  display_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  rank: number;
  composite_score: number;
  final_score: number;
  band: string;
  productivity: number;
  task_completion: number;
  attendance: number;
  efficiency: number;
  collaboration: number;
}

export interface AiDepartmentRankingRow {
  department_id: string | null;
  department_name: string;
  rank: number;
  member_count: number;
  avg_composite: number;
}

/** Backend `GET /api/v1/analytics/ai-performance-ranking` success `data`. */
export interface AiPerformanceRankingResponse {
  meta: {
    period: string;
    periodDays: number;
    employeeCount: number;
    source: string;
    aiMeta: unknown;
  };
  inputSummary: { note: string };
  data: {
    rankings: AiPerformanceRankingRow[];
    departments: AiDepartmentRankingRow[];
    weights: Record<string, number>;
    algorithms_used: string[];
    top_performer_ids: string[];
    low_performer_ids: string[];
  };
  traceId?: string;
}
