import { useQuery } from '@tanstack/react-query';
import { telemetryService } from './telemetry.service';
import type { TelemetryDetailResponse } from '@/types/telemetry';

export function useTelemetryActivityDetail(params: {
  organizationId?: string | null;
  userId: string | null;
  day: string | null;
  enabled: boolean;
}) {
  const { organizationId, userId, day, enabled } = params;

  return useQuery<TelemetryDetailResponse>({
    queryKey: ['telemetryDetail', organizationId ?? '', userId ?? '', day ?? ''],
    enabled: Boolean(enabled && organizationId && userId && day),
    queryFn: async () => {
      const envelope = await telemetryService.agentActivityDetail({
        organizationId: organizationId || undefined,
        userId: userId!,
        day: day!,
      });
      return (envelope as { data: TelemetryDetailResponse }).data;
    },
  });
}
