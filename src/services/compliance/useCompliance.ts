import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { complianceService } from "./compliance.service";
import type { CreateComplianceRulePayload, UpdateComplianceRulePayload } from "@/types/compliance";

const QUERY_KEYS = {
  rules: (params?: object) => ["compliance", "rules", params],
  violations: (params?: object) => ["compliance", "violations", params],
};

export function useComplianceRules(params?: { region?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.rules(params),
    queryFn: () => complianceService.listRules(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateComplianceRulePayload) => complianceService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] });
    },
  });
}

export function useUpdateComplianceRule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateComplianceRulePayload) => complianceService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] });
    },
  });
}

export function useDeleteComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] });
    },
  });
}

export function useComplianceViolations(params?: {
  userId?: string;
  region?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.violations(params),
    queryFn: () => complianceService.listViolations(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useResolveViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceService.resolveViolation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "violations"] });
    },
  });
}

export function useAcknowledgeComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
      complianceService.acknowledgeRule(id, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] });
    },
  });
}
