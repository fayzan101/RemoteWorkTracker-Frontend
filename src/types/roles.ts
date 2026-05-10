export interface Role {
  role_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}
