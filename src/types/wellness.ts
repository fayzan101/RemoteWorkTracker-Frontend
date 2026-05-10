export type MoodType = 'VERY_LOW' | 'LOW' | 'NEUTRAL' | 'GOOD' | 'GREAT' | 'STRESSED' | 'FOCUSED' | 'TIRED';

export interface WellnessLog {
  log_id?: string;
  user_id?: string;
  logId?: string;
  userId?: string;
  name?: string | null;
  date: string;
  mood: MoodType;
  energy_level?: number; // 1-5
  energyLevel?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WellnessListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface WellnessListResponse {
  meta: WellnessListMeta;
  data: WellnessLog[];
}

export interface CreateWellnessLogPayload {
  date: string;
  mood: MoodType;
  energyLevel?: number; // 1-5
  notes?: string;
}

export interface WellnessFilters {
  startDate?: string;
  endDate?: string;
  mood?: MoodType;
  minEnergy?: number;
  maxEnergy?: number;
  page?: number;
  limit?: number;
  userId?: string;
  organizationId?: string;
}

export const MOOD_OPTIONS: { value: MoodType; label: string; color: string }[] = [
  { value: 'VERY_LOW', label: 'Very Low', color: '#dc2626' },
  { value: 'LOW', label: 'Low', color: '#f97316' },
  { value: 'NEUTRAL', label: 'Neutral', color: '#eab308' },
  { value: 'GOOD', label: 'Good', color: '#84cc16' },
  { value: 'GREAT', label: 'Great', color: '#22c55e' },
  { value: 'STRESSED', label: 'Stressed', color: '#ef4444' },
  { value: 'FOCUSED', label: 'Focused', color: '#3b82f6' },
  { value: 'TIRED', label: 'Tired', color: '#0284c7' },
];
