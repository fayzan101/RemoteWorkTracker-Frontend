export interface Department {
  departmentId: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentPayload {
  name: string;
  organizationId?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
}

export interface ReassignUsersPayload {
  userIds: string[];
  targetDepartmentId: string;
}
