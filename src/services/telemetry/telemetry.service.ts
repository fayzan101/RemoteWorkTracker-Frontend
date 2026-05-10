import { apiClient } from '@/lib/api-client';
import type { TelemetryDailyResponse, TelemetryDetailResponse } from '@/types/telemetry';

const BASE = '/api/v1/telemetry';

export interface TelemetryListParams {
  organizationId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const telemetryService = {
  agentDaily(params?: TelemetryListParams) {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.userId) sp.append('userId', params.userId);
    if (params?.startDate) sp.append('startDate', params.startDate);
    if (params?.endDate) sp.append('endDate', params.endDate);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const q = sp.toString();
    const url = q ? `${BASE}/agent/daily?${q}` : `${BASE}/agent/daily`;
    return apiClient<{ data: TelemetryDailyResponse }>(url, { method: 'GET' });
  },

  agentActivityDetail(params: {
    organizationId?: string;
    userId: string;
    day: string;
    page?: number;
    limit?: number;
  }) {
    const sp = new URLSearchParams();
    sp.append('userId', params.userId);
    sp.append('day', params.day);
    if (params.organizationId) sp.append('organizationId', params.organizationId);
    if (params.page) sp.append('page', String(params.page));
    if (params.limit) sp.append('limit', String(params.limit));
    const url = `${BASE}/agent/activity-detail?${sp.toString()}`;
    return apiClient<{ data: TelemetryDetailResponse }>(url, { method: 'GET' });
  },

  agentAppsByDay(params: { organizationId?: string; day: string }) {
    const sp = new URLSearchParams();
    sp.append('day', params.day);
    if (params.organizationId) sp.append('organizationId', params.organizationId);
    return apiClient<{ data: { day: string; data: { appLabel: string; totalSeconds: number }[] } }>(
      `${BASE}/agent/apps-by-day?${sp.toString()}`,
      { method: 'GET' }
    );
  },

  agentDeskLatest(params: { organizationId?: string; day: string; userId?: string }) {
    const sp = new URLSearchParams();
    sp.append('day', params.day);
    if (params.organizationId) sp.append('organizationId', params.organizationId);
    if (params.userId) sp.append('userId', params.userId);
    return apiClient<{
      data: {
        day: string;
        data: {
          userId: string;
          name: string | null;
          appLabel: string | null;
          windowTitle: string | null;
          lastSeenAt: string;
        }[];
      };
    }>(`${BASE}/agent/desk-latest?${sp.toString()}`, { method: 'GET' });
  },
};
