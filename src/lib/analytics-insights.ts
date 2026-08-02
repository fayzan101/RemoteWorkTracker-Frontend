/** Parse AI report JSON (latest_report body) for Analytics UI. API uses snake_case from Python. */

export type AdaptiveBenchmarkInsight = {
  status: string;
  zScore: number;
  baselineMean: number;
  baselineStd: number;
  sampleCount: number;
  message: string;
};

export type AnomalyInsight = {
  isAnomaly: boolean;
  severity: string;
  reasons: string[];
};

export type DashboardAiInsight = {
  productivityScore: number | null;
  summary: string | null;
  burnoutRisk: string | null;
  delayRisk: string | null;
  attendancePattern: string | null;
  smartCategory: string | null;
  reliabilityScore: number | null;
  adaptiveBenchmark: AdaptiveBenchmarkInsight | null;
  anomaly: AnomalyInsight | null;
  telemetrySignalQuality: string | null;
  presenceConsistency: string | null;
  smartClusterId: number | null;
  smartCategoryRank: number | null;
  smartAlgorithms: string[] | null;
  smartFeatures: Record<string, string | number> | null;
  smartHistoryPoints: number | null;
  recommendations: string[];
  /** Honest transparency fields — never imply ML when rules-only. */
  scoringMode: 'rules' | 'hybrid' | string | null;
  ruleEngineVersion: string | null;
  modelVersion: string | null;
  confidence: number | null;
  dataQualityStatus: string | null;
  createdAt: string | null;
  explanations: Array<{ factor: string; contribution?: number; evidence?: string }> | null;
};

function parseBenchmark(raw: unknown): AdaptiveBenchmarkInsight | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const status = typeof b.status === 'string' ? b.status : null;
  if (!status) return null;
  return {
    status,
    zScore: typeof b.z_score === 'number' ? b.z_score : Number(b.z_score) || 0,
    baselineMean: typeof b.baseline_mean === 'number' ? b.baseline_mean : Number(b.baseline_mean) || 0,
    baselineStd: typeof b.baseline_std === 'number' ? b.baseline_std : Number(b.baseline_std) || 0,
    sampleCount: typeof b.sample_count === 'number' ? b.sample_count : Number(b.sample_count) || 0,
    message: typeof b.message === 'string' ? b.message : '',
  };
}

function parseAnomaly(raw: unknown): AnomalyInsight | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const reasons = Array.isArray(a.reasons)
    ? (a.reasons as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  return {
    isAnomaly: Boolean(a.is_anomaly),
    severity: typeof a.severity === 'string' ? a.severity : '—',
    reasons,
  };
}

function parseSmartFeatures(smartObj: Record<string, unknown> | null): {
  category: string | null;
  reliability: number | null;
  clusterId: number | null;
  categoryRank: number | null;
  algorithms: string[] | null;
  features: Record<string, string | number> | null;
  historyPoints: number | null;
} {
  if (!smartObj) {
    return {
      category: null,
      reliability: null,
      clusterId: null,
      categoryRank: null,
      algorithms: null,
      features: null,
      historyPoints: null,
    };
  }
  const rawFeat = smartObj.features;
  let features: Record<string, string | number> | null = null;
  if (rawFeat && typeof rawFeat === 'object' && !Array.isArray(rawFeat)) {
    features = {};
    for (const [k, v] of Object.entries(rawFeat as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) features[k] = Math.round(v * 10000) / 10000;
      else if (typeof v === 'string') features[k] = v;
    }
  }
  const alg = smartObj.algorithms_used;
  const algorithms = Array.isArray(alg) ? (alg as unknown[]).filter((x): x is string => typeof x === 'string') : null;
  return {
    category: typeof smartObj.attendance_category === 'string' ? smartObj.attendance_category : null,
    reliability: typeof smartObj.reliability_score === 'number' ? smartObj.reliability_score : null,
    clusterId: typeof smartObj.kmeans_cluster_id === 'number' ? smartObj.kmeans_cluster_id : null,
    categoryRank: typeof smartObj.category_rank === 'number' ? smartObj.category_rank : null,
    algorithms,
    features,
    historyPoints: typeof smartObj.history_points_for_consistency === 'number' ? smartObj.history_points_for_consistency : null,
  };
}

/** Parse a single report object (same shape as `latest_report`). */
export function parseAiReportBody(lr: Record<string, unknown> | undefined | null): DashboardAiInsight | null {
  if (!lr || typeof lr !== 'object') return null;

  const smartRaw = lr.smart_attendance;
  const smartObj =
    smartRaw && typeof smartRaw === 'object' ? (smartRaw as Record<string, unknown>) : null;
  const smart = parseSmartFeatures(smartObj);

  const rawRecs = lr.recommendations;
  const recommendations = Array.isArray(rawRecs)
    ? (rawRecs as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  const dq =
    lr.data_quality && typeof lr.data_quality === 'object'
      ? (lr.data_quality as Record<string, unknown>)
      : null;

  const explanationsRaw = lr.explanations;
  let explanations: DashboardAiInsight['explanations'] = null;
  if (Array.isArray(explanationsRaw)) {
    explanations = explanationsRaw
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
      .map((x) => ({
        factor: typeof x.factor === 'string' ? x.factor : 'factor',
        contribution: typeof x.contribution === 'number' ? x.contribution : undefined,
        evidence: typeof x.evidence === 'string' ? x.evidence : undefined,
      }));
  }

  const scoringModeRaw = typeof lr.scoring_mode === 'string' ? lr.scoring_mode : null;

  return {
    productivityScore: typeof lr.productivity_score === 'number' ? lr.productivity_score : null,
    summary: typeof lr.summary === 'string' ? lr.summary : null,
    burnoutRisk: typeof lr.burnout_risk === 'string' ? lr.burnout_risk : null,
    delayRisk: typeof lr.task_delay_risk === 'string' ? lr.task_delay_risk : null,
    attendancePattern: typeof lr.attendance_pattern === 'string' ? lr.attendance_pattern : null,
    smartCategory: smart.category,
    reliabilityScore: smart.reliability,
    adaptiveBenchmark: parseBenchmark(lr.adaptive_benchmark),
    anomaly: parseAnomaly(lr.anomaly_detection),
    telemetrySignalQuality:
      typeof lr.telemetry_signal_quality === 'string' ? lr.telemetry_signal_quality : null,
    presenceConsistency: typeof lr.presence_consistency === 'string' ? lr.presence_consistency : null,
    smartClusterId: smart.clusterId,
    smartCategoryRank: smart.categoryRank,
    smartAlgorithms: smart.algorithms,
    smartFeatures: smart.features,
    smartHistoryPoints: smart.historyPoints,
    recommendations,
    scoringMode: scoringModeRaw,
    ruleEngineVersion: typeof lr.rule_engine_version === 'string' ? lr.rule_engine_version : null,
    modelVersion: typeof lr.model_version === 'string' ? lr.model_version : null,
    confidence: typeof lr.confidence === 'number' ? lr.confidence : null,
    dataQualityStatus: dq && typeof dq.status === 'string' ? dq.status : null,
    createdAt: typeof lr.created_at === 'string' ? lr.created_at : null,
    explanations,
  };
}

export function extractLatestAiReportForDashboard(
  data: Record<string, unknown> | undefined
): DashboardAiInsight | null {
  if (!data || typeof data !== 'object') return null;
  const latest = data.latest_report;
  if (!latest || typeof latest !== 'object') return null;
  const parsed = parseAiReportBody(latest as Record<string, unknown>);
  if (!parsed) return null;
  if (!parsed.createdAt && Array.isArray(data.history) && data.history[0]) {
    const first = data.history[0] as Record<string, unknown>;
    if (typeof first.created_at === 'string') parsed.createdAt = first.created_at;
  }
  return parsed;
}

/** Human label — never call rules-only output a "learned prediction". */
export function scoringModeLabel(mode: string | null | undefined): string {
  if (!mode) return 'Unknown scoring mode';
  if (mode === 'rules') return 'Deterministic rules (not a learned model)';
  if (mode === 'hybrid') return 'Hybrid (rules + optional ML signals)';
  return mode;
}

export function isStaleReport(createdAt: string | null | undefined, maxAgeHours = 36): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t > maxAgeHours * 3600_000;
}

export function shouldWarnSparseOrLowConfidence(insight: DashboardAiInsight | null): boolean {
  if (!insight) return false;
  if (insight.confidence != null && insight.confidence < 0.45) return true;
  if (insight.dataQualityStatus && /poor|sparse|degraded/i.test(insight.dataQualityStatus)) return true;
  if (insight.telemetrySignalQuality && /sparse|limited|low/i.test(insight.telemetrySignalQuality)) {
    return true;
  }
  return false;
}
