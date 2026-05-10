export interface Project {
  project_id: string;
  name: string;
  description?: string;
  manager_id: string;
  organization_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  member_id: string;
  project_id: string;
  user_id: string;
  role?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  manager_id: string;
  organization_id: string;
  start_date: string;
  end_date: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AddProjectMemberPayload {
  user_id: string;
  role?: string;
}
