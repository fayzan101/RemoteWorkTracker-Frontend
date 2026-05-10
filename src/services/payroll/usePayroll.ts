import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollService } from './payroll.service';
import type { PayrollFilters, PayrollGeneratePayload } from '@/types';

const QUERY_KEYS = {
  list: (filters?: PayrollFilters) => ['payroll', 'list', filters],
};

export function usePayrollList(filters?: PayrollFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => payrollService.list(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PayrollGeneratePayload) => payrollService.generate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}