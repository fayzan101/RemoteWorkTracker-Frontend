import { OrganizationForgotPasswordPayload } from "./organization.service";
import { OrganizationLoginPayload } from "./organization.service";
import { OrganizationResetPasswordPayload } from "./organization.service";
import type { OrganizationResponse, AuthResponse } from "./organization.service";
import { useMutation } from "@tanstack/react-query";
import { organizationService, CreateOrganizationPayload, getRefreshToken, removeTokens } from "./organization.service";
import { useQuery } from "@tanstack/react-query";
import { removeAccessToken, removeRefreshToken } from "@/lib/api-client";

export function useOrganizationForgotPassword() {
  return useMutation({
    mutationFn: (data: OrganizationForgotPasswordPayload) =>
      organizationService.forgotPassword(data),
    onSuccess: (data) => {
      console.log("Forgot password email sent:", data);
    },
    onError: (error: any) => {
      console.error("Forgot password error:", error.message);
    },
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (data: CreateOrganizationPayload) =>
      organizationService.create(data),
    onSuccess: (data: AuthResponse) => {
      console.log("Organization created and tokens stored:", data);
    },
    onError: (error: any) => {
      console.error("Error:", error.message);
    },
  });
}

export function useOrganizationLogin() {
  return useMutation({
    mutationFn: (data: OrganizationLoginPayload) => {
      // Clear old tokens before login attempt
      removeAccessToken();
      removeRefreshToken();
      return organizationService.login(data);
    },
    onSuccess: (data: AuthResponse) => {
      console.log("Organization login success - tokens stored:", data);
    },
    onError: (error: any) => {
      console.error("Login error:", error.message);
    },
  });
}

export function useOrganizationLogout() {
  return useMutation({
    mutationFn: (refreshToken: string) => organizationService.logout(refreshToken),
    onSuccess: (data) => {
      removeTokens();
      console.log("Logout success - tokens cleared:", data);
    },
    onError: (error: any) => {
      console.error("Logout error:", error.message);
    },
  });
}

export function useOrganizationRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) => organizationService.refreshToken(refreshToken),
    onSuccess: (data) => {
      console.log("Token refreshed:", data);
    },
    onError: (error: any) => {
      console.error("Refresh token error:", error.message);
    },
  });
}

export function useOrganizationResetPassword() {
  return useMutation({
    mutationFn: (data: OrganizationResetPasswordPayload) =>
      organizationService.resetPassword(data),
    onSuccess: (data) => {
      console.log("Password reset success:", data);
    },
    onError: (error: any) => {
      console.error("Password reset error:", error.message);
    },
  });
}

export function useGetOrganizationById(id: string) {
  return useQuery<OrganizationResponse>({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getById(id),
    enabled: !!id && id.trim().length > 0,
  });
}