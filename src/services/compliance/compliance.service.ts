import { apiClient } from "@/lib/api-client";
import type {
  ComplianceRule,
  CreateComplianceRulePayload,
  UpdateComplianceRulePayload,
  ComplianceRulesListResponse,
  ComplianceViolationsListResponse,
  ComplianceViolation,
} from "@/types/compliance";

const ENDPOINTS = {
  RULES: "/api/v1/compliance/rules",
  RULE: "/api/v1/compliance/rules/:id",
  ACKNOWLEDGE: "/api/v1/compliance/rules/:id/acknowledge",
  VIOLATIONS: "/api/v1/compliance/violations",
  RESOLVE: "/api/v1/compliance/violations/:id/resolve",
};

export const complianceService = {
  listRules: (params?: { region?: string; page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.region) search.append("region", params.region);
    if (params?.page) search.append("page", String(params.page));
    if (params?.limit) search.append("limit", String(params.limit));
    const qs = search.toString();
    return apiClient<{ data: ComplianceRulesListResponse }>(
      qs ? `${ENDPOINTS.RULES}?${qs}` : ENDPOINTS.RULES,
      { method: "GET" }
    );
  },

  createRule: (payload: CreateComplianceRulePayload) =>
    apiClient<{ data: ComplianceRule }>(ENDPOINTS.RULES, {
      method: "POST",
      body: payload,
    }),

  updateRule: (id: string, payload: UpdateComplianceRulePayload) =>
    apiClient<{ data: ComplianceRule }>(ENDPOINTS.RULE.replace(":id", id), {
      method: "PATCH",
      body: payload,
    }),

  deleteRule: (id: string) =>
    apiClient<{ data: { message: string } }>(ENDPOINTS.RULE.replace(":id", id), {
      method: "DELETE",
    }),

  acknowledgeRule: (id: string, signatureData: string) =>
    apiClient<{ data: { message?: string } }>(ENDPOINTS.ACKNOWLEDGE.replace(":id", id), {
      method: "POST",
      body: { signatureData },
    }),

  listViolations: (params?: {
    userId?: string;
    region?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.userId) search.append("userId", params.userId);
    if (params?.region) search.append("region", params.region);
    if (params?.status) search.append("status", params.status);
    if (params?.page) search.append("page", String(params.page));
    if (params?.limit) search.append("limit", String(params.limit));
    const qs = search.toString();
    return apiClient<{ data: ComplianceViolationsListResponse }>(
      qs ? `${ENDPOINTS.VIOLATIONS}?${qs}` : ENDPOINTS.VIOLATIONS,
      { method: "GET" }
    );
  },

  resolveViolation: (id: string) =>
    apiClient<{ data: ComplianceViolation }>(ENDPOINTS.RESOLVE.replace(":id", id), {
      method: "PATCH",
      body: { status: "RESOLVED" },
    }),
};
