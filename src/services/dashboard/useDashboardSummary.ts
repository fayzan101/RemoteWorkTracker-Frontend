import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboard.service';
import type { DashboardSummary } from '@/types/dashboard';

function parseDashboardSummaryEnvelope(res: unknown): DashboardSummary {
  if (!res || typeof res !== 'object') {
    throw new Error('Empty dashboard response');
  }
  const body = res as { success?: boolean; data?: DashboardSummary; message?: string };
  if (body.data) return body.data;
  throw new Error(body.message || 'Dashboard summary missing data');
}

export function useDashboardSummary(params: { organizationId?: string | null; days?: number; enabled?: boolean }) {
  const { organizationId, days = 7, enabled = true } = params;

  return useQuery({
    queryKey: ['dashboard', 'summary', organizationId ?? '', days],
    enabled: Boolean(enabled && organizationId),
    queryFn: async () => {
      const res = await dashboardService.summary({ organizationId: organizationId || undefined, days });
      return parseDashboardSummaryEnvelope(res);
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
