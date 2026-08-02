export interface ComplianceRule {
  ruleId: string;
  region: string;
  maxWeeklyHours: number;
  overtimeAllowed: boolean;
  minBreakHours: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComplianceRulePayload {
  region: string;
  maxWeeklyHours: number;
  overtimeAllowed?: boolean;
  minBreakHours?: number;
  description?: string;
}

export interface UpdateComplianceRulePayload {
  region?: string;
  maxWeeklyHours?: number;
  overtimeAllowed?: boolean;
  minBreakHours?: number;
  description?: string;
}

export interface ComplianceViolation {
  violationId: string;
  userId: string;
  ruleId: string;
  description?: string | null;
  status: string;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface ComplianceListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface ComplianceRulesListResponse {
  meta: ComplianceListMeta;
  data: ComplianceRule[];
}

export interface ComplianceViolationsListResponse {
  meta: ComplianceListMeta;
  data: ComplianceViolation[];
}
