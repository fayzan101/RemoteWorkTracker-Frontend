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
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (data: CreateOrganizationPayload) =>
      organizationService.create(data),
  });
}

export function useOrganizationLogin() {
  return useMutation({
    mutationFn: (data: OrganizationLoginPayload) => {
      removeAccessToken();
      removeRefreshToken();
      return organizationService.login(data);
    },
  });
}

export function useOrganizationLogout() {
  return useMutation({
    mutationFn: (refreshToken: string) => organizationService.logout(refreshToken),
    onSuccess: () => {
      removeTokens();
    },
    onError: () => {
      removeTokens();
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: (data: {
      organizationId: string;
      oldPassword: string;
      newPassword: string;
    }) => organizationService.changeAdminPassword(data),
  });
}

export function useOrganizationRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) => organizationService.refreshToken(refreshToken),
  });
}

export function useOrganizationResetPassword() {
  return useMutation({
    mutationFn: (data: OrganizationResetPasswordPayload) =>
      organizationService.resetPassword(data),
  });
}

export function useGetOrganizationById(id: string) {
  return useQuery<OrganizationResponse>({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getById(id),
    enabled: !!id && id.trim().length > 0,
  });
}
