import { toast } from "react-toastify";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
type RequestOptions = Omit<RequestInit, "body"> & {
  body?: any;
  suppressErrorToast?: boolean;
};

type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

function extractAccessToken(payload: TokenPayload | null | undefined) {
  return payload?.accessToken || payload?.data?.accessToken || null;
}

function extractRefreshToken(payload: TokenPayload | null | undefined) {
  return payload?.refreshToken || payload?.data?.refreshToken || null;
}

export function getAccessToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken") || localStorage.getItem("access_token");
  }
  return null;
}

export function saveAccessToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("access_token", token);
  }
}

export function getRefreshToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken") || localStorage.getItem("refresh_token");
  }
  return null;
}

export function saveRefreshToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("refreshToken", token);
    localStorage.setItem("refresh_token", token);
  }
}

export function removeAccessToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
  }
}

export function removeRefreshToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh_token");
  }
}

export function saveOrganizationId(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("organizationId", id);
  }
}

export function getOrganizationId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("organizationId");
  }
  return null;
}

export function removeOrganizationId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("organizationId");
  }
}

const AUTH_USER_KEY = "authUser";

export type StoredAuthUser = {
  id: string;
  name: string;
  email: string;
};

export function saveAuthUser(user: StoredAuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function getAuthUser(): StoredAuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (parsed && typeof parsed.id === "string") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function removeAuthUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

async function tryRefreshWithEndpoint(path: string, refreshToken: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  let data: TokenPayload | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return null;
  }

  const nextAccessToken = extractAccessToken(data);
  const nextRefreshToken = extractRefreshToken(data);

  if (!nextAccessToken) {
    return null;
  }

  saveAccessToken(nextAccessToken);
  if (nextRefreshToken) {
    saveRefreshToken(nextRefreshToken);
  }

  return nextAccessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const userPath = "/api/v1/users/refresh-token";
  const orgPath = "/api/v1/organizations/refresh-token";
  let next = await tryRefreshWithEndpoint(orgPath, refreshToken);
  if (!next) {
    next = await tryRefreshWithEndpoint(userPath, refreshToken);
  }
  return next;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
  retry = true
): Promise<T> {
  const { body, headers, suppressErrorToast, ...rest } = options;
  const accessToken = getAccessToken();
  if (!accessToken && typeof window !== "undefined" && endpoint.startsWith("/api/v1/")) {
    console.warn(`[apiClient] No access token for request: ${endpoint}`);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const isRefreshEndpoint =
    endpoint === "/api/v1/organizations/refresh-token" || endpoint === "/api/v1/users/refresh-token";
  if (res.status === 401 && retry && !isRefreshEndpoint) {
    try {
      const refreshedToken = await refreshAccessToken();
      if (!refreshedToken) {
        throw new Error("No access token received during refresh.");
      }
      return apiClient<T>(endpoint, options, false);
    } catch (e) {
      removeAccessToken();
      removeRefreshToken();
      const errorMsg = "Session expired. Please log in again.";
      if (typeof window !== "undefined" && !suppressErrorToast) {
        toast.error(errorMsg);
      }
      throw new Error(errorMsg);
    }
  }
  
  let data: any;
  try {
    data = await res.json();
  } catch {
    // If response is not JSON, create error message from status
    const errorMessage = `Server error: ${res.status} ${res.statusText}`;
    if (typeof window !== "undefined" && res.status != 404 && res.status != 400 && !suppressErrorToast) {
      toast.error(errorMessage);
    }
    throw new Error(errorMessage);
  }
  
  if (!res.ok) {
    const errorMessage = data?.message || data?.error || `API Error: ${res.status}`;
    // Show toast for client errors (4xx) and server errors (5xx)
    if (typeof window !== "undefined" && res.status != 404 && res.status != 400 && !suppressErrorToast) {
      toast.error(errorMessage);
    }
    throw new Error(errorMessage);
  }
  return data;
}