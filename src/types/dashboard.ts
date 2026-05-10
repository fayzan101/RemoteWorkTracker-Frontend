/** Matches backend `GET /api/v1/dashboard/summary` success `data` payload. */
export interface DashboardSummary {
  organizationId: string;
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
  me?: {
    userId: string;
    activeSeconds: number;
    idleSeconds: number;
    segmentCount: number;
    personDaysWithData: number;
  };
  unreadNotifications?: number;
}

export interface DashboardSummaryParams {
  organizationId?: string;
  days?: number;
}
