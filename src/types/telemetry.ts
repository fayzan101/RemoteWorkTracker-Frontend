export interface TelemetryDailyRow {
  userId: string;
  name: string | null;
  day: string;
  firstSeen: string | null;
  lastSeen: string | null;
  activeSeconds: number;
  idleSeconds: number;
  segmentCount: number;
  syntheticAttendanceId: string;
}

export interface TelemetryListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface TelemetryDailyResponse {
  data: TelemetryDailyRow[];
  meta: TelemetryListMeta;
}

export interface TelemetrySegmentRow {
  userId: string;
  name: string | null;
  createdAt: string;
  action: string;
  deviceId: string | null;
  description: string | null;
  durationSeconds: number;
  windowTitle: string | null;
  appLabel: string | null;
}

export interface TelemetryDetailResponse {
  userId: string;
  day: string;
  data: TelemetrySegmentRow[];
  meta: TelemetryListMeta;
}
