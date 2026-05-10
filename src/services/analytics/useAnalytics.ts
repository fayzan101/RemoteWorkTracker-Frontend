import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from './analytics.service';
import type {
  AiPerformanceRankingResponse,
  AnalyticsOverviewParams,
  AnalyticsReportFilters,
  AnalyticsOverviewPayload,
  PortalAiGenerateResponse,
  PortalAiWeeklyReportsData,
  ProductivityResponse,
  TeamPerformanceResponse,
} from '@/types';

const QUERY_KEYS = {
  productivity: (filters?: AnalyticsReportFilters) => ['analytics', 'productivity', filters],
  teamPerformance: (filters?: AnalyticsReportFilters) => ['analytics', 'team-performance', filters],
  overview: (params?: AnalyticsOverviewParams) => ['analytics', 'overview', params],
  aiWeekly: (employeeId?: string, limit?: number) => ['analytics', 'ai-weekly', employeeId, limit] as const,
  aiRanking: (filters?: AnalyticsReportFilters) => ['analytics', 'ai-performance-ranking', filters] as const,
};

type ApiSuccess<T> = { success?: boolean; message?: string; data: T };

export function useProductivityReport(filters?: AnalyticsReportFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.productivity(filters),
    queryFn: async () => {
      const res = await analyticsService.productivity(filters);
      const body = res as ApiSuccess<ProductivityResponse>;
      return body.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeamPerformanceReport(filters?: AnalyticsReportFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.teamPerformance(filters),
    queryFn: async () => {
      const res = await analyticsService.teamPerformance(filters);
      const body = res as ApiSuccess<TeamPerformanceResponse>;
      return body.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAiPerformanceRanking(filters?: AnalyticsReportFilters, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.aiRanking(filters),
    queryFn: async () => {
      const res = await analyticsService.aiPerformanceRanking(filters);
      const body = res as ApiSuccess<AiPerformanceRankingResponse>;
      return body.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

export function useAnalyticsOverview(params?: AnalyticsOverviewParams) {
  return useQuery({
    queryKey: QUERY_KEYS.overview(params),
    queryFn: async () => {
      const res = await analyticsService.overview(params);
      const body = res as ApiSuccess<AnalyticsOverviewPayload>;
      return body.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function usePortalAiWeeklyReports(employeeId: string | undefined, limit = 14) {
  return useQuery({
    queryKey: QUERY_KEYS.aiWeekly(employeeId, limit),
    queryFn: async () => {
      if (!employeeId) throw new Error('employeeId required');
      const res = await analyticsService.aiWeeklyReports(employeeId, limit);
      const body = res as ApiSuccess<PortalAiWeeklyReportsData>;
      return body.data;
    },
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useGenerateAiReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await analyticsService.generateAiReport(employeeId);
      const body = res as ApiSuccess<PortalAiGenerateResponse>;
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'ai-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
    },
  });
}
