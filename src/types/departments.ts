export interface Department {
  departmentId: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentPayload {
  name: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
}

export interface ReassignUsersPayload {
  fromDepartmentId: string;
  toDepartmentId: string;
}
