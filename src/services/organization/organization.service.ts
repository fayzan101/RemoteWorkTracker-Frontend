import {
  apiClient,
  saveAccessToken,
  saveRefreshToken,
  removeAccessToken,
  removeRefreshToken,
  saveOrganizationId,
  removeOrganizationId,
  removeAuthUser,
} from "../../lib/api-client";
export type OrganizationForgotPasswordPayload = {
  email: string;
};
export type OrganizationLoginPayload = {
  email: string;
  password: string;
};
export type OrganizationResetPasswordPayload = {
  resetCode: string;
  newPassword: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  data: {
    organization_id: string;
    name: string;
    address: string;
    organization_type: string;
    created_at: string;
    updated_at: string;
  };
};

const ENDPOINTS = {
  CREATE: "/api/v1/organizations",
  LOGIN: "/api/v1/organizations/login",
  FORGOT_PASSWORD: "/api/v1/organizations/forgot-password",
  LOGOUT: "/api/v1/organizations/logout",
  REFRESH_TOKEN: "/api/v1/organizations/refresh-token",
  RESET_PASSWORD: "/api/v1/organizations/reset-password",
  GET_BY_ID: "/api/v1/organizations/",
};
export type OrganizationResponse = {
  success: boolean;
  message: string;
  data: {
    organization_id: string;
    name: string;
    address: string;
    organization_type: string;
    created_at: string;
    updated_at: string;
  };
};
export type CreateOrganizationPayload = {
  name: string;
  address: string;
  organization_type: string;
  adminEmail: string;
  adminPassword: string;
};

// Helper to extract and save tokens
function handleAuthResponse(response: any): any {
  // Handle both top-level tokens and nested tokens
  const accessToken = response?.accessToken || response?.data?.accessToken;
  const refreshToken = response?.refreshToken || response?.data?.refreshToken;
  const organizationId = response?.data?.organizationId || response?.data?.organization_id || response?.organization_id;
  
  if (accessToken) {
    saveAccessToken(accessToken);
  }
  if (refreshToken) {
    saveRefreshToken(refreshToken);
  }
  if (organizationId) {
    saveOrganizationId(organizationId);
  }
  removeAuthUser();

  return response;
}

export const organizationService = {
  create: async (payload: CreateOrganizationPayload) => {
    const response = await apiClient<AuthResponse>(ENDPOINTS.CREATE, {
      method: "POST",
      body: payload,
    });
    return handleAuthResponse(response);
  },

  login: async (payload: OrganizationLoginPayload) => {
    const response = await apiClient<AuthResponse>(ENDPOINTS.LOGIN, {
      method: "POST",
      body: payload,
    });
    return handleAuthResponse(response);
  },

  forgotPassword: (payload: OrganizationForgotPasswordPayload) =>
    apiClient(ENDPOINTS.FORGOT_PASSWORD, {
      method: "POST",
      body: payload,
    }),

  logout: (refreshToken: string) =>
    apiClient(ENDPOINTS.LOGOUT, {
      method: "POST",
      body: { refreshToken },
    }).then(() => {
      removeAccessToken();
      removeRefreshToken();
      removeOrganizationId();
    }),

  refreshToken: (refreshToken: string) =>
    apiClient(ENDPOINTS.REFRESH_TOKEN, {
      method: "POST",
      body: { refreshToken },
    }),

  resetPassword: (payload: OrganizationResetPasswordPayload) =>
    apiClient(ENDPOINTS.RESET_PASSWORD, {
      method: "POST",
      body: payload,
    }),
  getById: (id: string) =>
    apiClient<OrganizationResponse>(ENDPOINTS.GET_BY_ID + id, {
      method: "GET",
    }),
};

// Export token management functions
export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
}

export function removeTokens() {
  removeAccessToken();
  removeOrganizationId();
  removeRefreshToken();
  removeAuthUser();
}