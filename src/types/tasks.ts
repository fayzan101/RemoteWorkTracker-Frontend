export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskComment {
  comment_id?: string;
  commentId?: string;
  task_id?: string;
  taskId?: string;
  user_id?: string;
  userId?: string;
  comment: string;
  created_at?: string;
  createdAt?: string;
}

export interface Task {
  task_id?: string;
  taskId?: string;
  title: string;
  description?: string | null;
  assigned_to?: string;
  assignedTo?: string;
  project_id?: string;
  projectId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  comments?: TaskComment[];
  assignee_name?: string;
  assigneeName?: string;
  project_name?: string;
  projectName?: string;
}

export interface TaskListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface TaskListResponse {
  meta?: TaskListMeta;
  data?: Task[];
}

export interface TaskFilters {
  assignedTo?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo: string;
  projectId: string;
  priority: TaskPriority;
  deadline: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
}
