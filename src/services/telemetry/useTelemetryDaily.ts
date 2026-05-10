import { useQuery } from '@tanstack/react-query';
import { telemetryService } from './telemetry.service';
import type { TelemetryDailyResponse, TelemetryDailyRow } from '@/types/telemetry';

export function useTelemetryDaily(params: {
  organizationId?: string | null;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}) {
  const { organizationId, startDate, endDate, enabled = true } = params;

  return useQuery({
    queryKey: ['telemetry', 'daily', organizationId ?? '', startDate, endDate],
    enabled: Boolean(enabled && organizationId && startDate && endDate),
    queryFn: async () => {
      const res = await telemetryService.agentDaily({
        organizationId: organizationId || undefined,
        startDate,
        endDate,
        page: 1,
        limit: 100_000,
      });
      const body = res as { data?: TelemetryDailyResponse };
      const daily = body.data;
      if (!daily || !Array.isArray(daily.data)) return [];
      return daily.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}
