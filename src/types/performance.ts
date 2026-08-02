export interface PerformanceReview {
  reviewId: string;
  userId: string;
  reviewerId?: string | null;
  period: string;
  attendanceScore: number;
  taskCompletionScore: number;
  goalProgressScore: number;
  wellnessScore: number;
  overallScore: number;
  status: string;
  comments?: string | null;
  generatedAt?: string;
  finalizedAt?: string | null;
  signedAt?: string | null;
  hasSignature?: boolean;
}

export interface GeneratePerformancePayload {
  userId: string;
  period: string;
}

export interface FinalizePerformancePayload {
  comments?: string;
  signatureData?: string;
}

export interface PerformanceListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PerformanceListResponse {
  meta: PerformanceListMeta;
  data: PerformanceReview[];
}

export interface PerformanceFilters {
  userId?: string;
  period?: string;
  status?: string;
  page?: number;
  limit?: number;
}
