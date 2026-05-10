export interface Organization {
  organization_id: string;
  name: string;
  organization_type?: string;
  address?: string;
  admin_email: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  user_id: string;
  name: string;
  email: string;
  role_id: string;
  department_id: string;
  region?: string;
  salary?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationUserPayload {
  name: string;
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  region?: string;
  salary?: number;
}
