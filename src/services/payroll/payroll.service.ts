import { apiClient } from '@/lib/api-client';
import type {
  PayrollFilters,
  PayrollGeneratePayload,
  PayrollGenerateResponse,
  PayrollListResponse,
  PayrollRecord,
} from '@/types';

const ENDPOINTS = {
  LIST: '/api/v1/payroll',
  GENERATE: '/api/v1/payroll/generate',
};

export const payrollService = {
  list: (filters?: PayrollFilters) => {
    const params = new URLSearchParams();

    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.month) params.append('month', filters.month);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.LIST}?${queryString}` : ENDPOINTS.LIST;

    return apiClient<{ data: PayrollListResponse | PayrollRecord[] }>(url, {
      method: 'GET',
    });
  },

  generate: (payload: PayrollGeneratePayload) =>
    apiClient<{ data: PayrollGenerateResponse }>(ENDPOINTS.GENERATE, {
      method: 'POST',
      body: payload,
    }),
};