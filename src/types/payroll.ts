export interface PayrollRecord {
  payrollId: string;
  userId: string;
  employeeName: string | null;
  month: string;
  basicSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  netPay: number;
  generatedAt: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface PayrollListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PayrollListResponse {
  meta?: PayrollListMeta;
  data?: PayrollRecord[];
}

export interface PayrollFilters {
  userId?: string;
  month?: string;
  page?: number;
  limit?: number;
}

export interface PayrollGeneratePayload {
  month: string;
}

export interface PayrollGenerateResponse {
  payrollId?: string;
  month: string;
  generatedAt: string;
  entriesGenerated: number;
}