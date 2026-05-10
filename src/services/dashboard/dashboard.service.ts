import { apiClient } from '@/lib/api-client';
import type { DashboardSummary, DashboardSummaryParams } from '@/types/dashboard';

export const dashboardService = {
  summary(params?: DashboardSummaryParams) {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.days != null) sp.append('days', String(params.days));
    const q = sp.toString();
    const url = q ? `/api/v1/dashboard/summary?${q}` : '/api/v1/dashboard/summary';
    return apiClient<{ data: DashboardSummary }>(url, { method: 'GET' });
  },
};
