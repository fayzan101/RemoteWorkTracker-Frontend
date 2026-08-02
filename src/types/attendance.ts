export type AttendanceStatus =
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'MISSED'
  | 'LATE'
  | 'ON_TIME'
  | 'AGENT_DESK';

export interface AttendanceLocation {
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  ip_address?: string;
}

export interface AttendanceLog {
  attendance_id?: string;
  attendanceId?: string;
  session_id?: string;
  sessionId?: string;
  user_id?: string;
  userId?: string;
  name?: string | null;
  check_in?: string;
  checkIn?: string;
  check_out?: string | null;
  checkOut?: string | null;
  status?: AttendanceStatus;
  worked_hours?: number;
  workedHours?: number;
  location?: AttendanceLocation;
  deviceId?: string;
  device_id?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  /** Workspace day key (YYYY-MM-DD) — agent telemetry façade */
  day?: string;
  activeSeconds?: number;
  active_seconds?: number;
  idleSeconds?: number;
  idle_seconds?: number;
  segmentCount?: number;
  segment_count?: number;
  source?: string;
}

export interface AttendanceListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface AttendanceListResponse {
  meta?: AttendanceListMeta;
  data?: AttendanceLog[];
  attendanceLogs?: AttendanceLog[];
  userId?: string;
}

export interface AttendanceFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
}

export interface GeoFence {
  fenceId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface CreateGeoFencePayload {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}
