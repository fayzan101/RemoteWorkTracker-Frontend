export interface Goal {
  goal_id?: string;
  user_id?: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  deadline: string;
  created_at: string;
  updated_at: string;
  goalId: string;
  userId: string;
}

export interface CreateGoalPayload {
  title: string;
  userId: string;
  description?: string;
  deadline: string;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string;
  deadline?: string;
}

export interface UpdateGoalProgressPayload {
  progress: number; // 0-100
}

export type GoalStatus = 'ON_TRACK' | 'AT_RISK';

export interface GoalFilters {
  userId?: string;
  organizationId?: string;
  status?: GoalStatus;
  page?: number;
  limit?: number;
}
