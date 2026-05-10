export interface User {
  // Primary key
  id?: string;
  user_id?: string;
  userId?: string;

  // Basic info
  name: string;
  email: string;

  // Relations
  role?: string;
  role_id?: string;
  roleId?: string;
  department_id?: string;
  departmentId?: string;
  organization_id?: string;
  organizationId?: string;

  // Details
  region?: string;
  salary?: number | string;

  // Metadata
  password_hash?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  organizationId: string;
  region: string;
  salary: number;
}

export interface UpdateUserPayload {
  name?: string;
  role_id?: string;
  roleId?: string;
  department_id?: string;
  departmentId?: string;
  region?: string;
  salary?: number | string;
}
