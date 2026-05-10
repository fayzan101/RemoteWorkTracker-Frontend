import { apiClient } from '@/lib/api-client';
import type {
  AiPerformanceRankingResponse,
  AnalyticsOverviewPayload,
  AnalyticsOverviewParams,
  AnalyticsReportFilters,
  PortalAiGenerateResponse,
  PortalAiWeeklyReportsData,
  ProductivityResponse,
  TeamPerformanceResponse,
} from '@/types';

const ENDPOINTS = {
  OVERVIEW: '/api/v1/analytics/overview',
  PRODUCTIVITY: '/api/v1/analytics/productivity',
  TEAM_PERFORMANCE: '/api/v1/analytics/team-performance',
  AI_PERFORMANCE_RANKING: '/api/v1/analytics/ai-performance-ranking',
};

function buildOverviewParams(params?: AnalyticsOverviewParams) {
  const sp = new URLSearchParams();
  if (params?.organizationId) sp.append('organizationId', params.organizationId);
  if (params?.days != null) sp.append('days', String(params.days));
  if (params?.employeeId) sp.append('employeeId', params.employeeId);
  if (params?.aiReportLimit != null) sp.append('aiReportLimit', String(params.aiReportLimit));
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function buildDateRangeQuery(filters?: AnalyticsReportFilters) {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.projectId) params.append('projectId', filters.projectId);
  if (filters?.teamId) params.append('teamId', filters.teamId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const analyticsService = {
  overview: (params?: AnalyticsOverviewParams) =>
    apiClient<{ success: boolean; message: string; data: AnalyticsOverviewPayload }>(
      `${ENDPOINTS.OVERVIEW}${buildOverviewParams(params)}`,
      {
        method: 'GET',
      }
    ),

  productivity: (filters?: AnalyticsReportFilters) =>
    apiClient<{ success: boolean; message: string; data: ProductivityResponse }>(
      `${ENDPOINTS.PRODUCTIVITY}${buildDateRangeQuery(filters)}`,
      {
        method: 'GET',
      }
    ),

  teamPerformance: (filters?: AnalyticsReportFilters) =>
    apiClient<{ success: boolean; message: string; data: TeamPerformanceResponse }>(
      `${ENDPOINTS.TEAM_PERFORMANCE}${buildDateRangeQuery(filters)}`,
      {
        method: 'GET',
      }
    ),

  aiPerformanceRanking: (filters?: AnalyticsReportFilters) =>
    apiClient<{ success: boolean; message: string; data: AiPerformanceRankingResponse }>(
      `${ENDPOINTS.AI_PERFORMANCE_RANKING}${buildDateRangeQuery(filters)}`,
      { method: 'GET', suppressErrorToast: true }
    ),

  aiWeeklyReports: (employeeId: string, limit?: number) => {
    const sp = new URLSearchParams();
    if (limit != null) sp.append('limit', String(limit));
    const q = sp.toString();
    return apiClient<{ success: boolean; message: string; data: PortalAiWeeklyReportsData }>(
      `/api/v1/analytics/ai-reports/${encodeURIComponent(employeeId)}${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
  },

  generateAiReport: (employeeId: string) =>
    apiClient<{ success: boolean; message: string; data: PortalAiGenerateResponse }>(
      '/api/v1/analytics/ai-report/generate',
      {
        method: 'POST',
        body: { employeeId },
      }
    ),
};
