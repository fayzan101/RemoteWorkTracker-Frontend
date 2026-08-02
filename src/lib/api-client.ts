import { toast } from "react-toastify";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function requireApiBaseUrl(): string {
  if (!BASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Add it to web/.env.local (e.g. http://localhost:5000).'
    );
  }
  return BASE_URL;
}
type RequestOptions = Omit<RequestInit, "body"> & {
  body?: any;
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

function clearSession() {
  removeAccessToken();
  removeRefreshToken();
  removeOrganizationId();
  removeAuthUser();
}

type RefreshAttempt = {
  token: string | null;
  rateLimited: boolean;
};

async function tryRefreshWithEndpoint(path: string, refreshToken: string): Promise<RefreshAttempt> {
  const res = await fetch(`${requireApiBaseUrl()}${path}`, {
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

  if (res.status === 429) {
    return { token: null, rateLimited: true };
  }

  if (!res.ok) {
    return { token: null, rateLimited: false };
  }

  const nextAccessToken = extractAccessToken(data);
  const nextRefreshToken = extractRefreshToken(data);

  if (!nextAccessToken) {
    return { token: null, rateLimited: false };
  }

  saveAccessToken(nextAccessToken);
  if (nextRefreshToken) {
    saveRefreshToken(nextRefreshToken);
  }

  return { token: nextAccessToken, rateLimited: false };
}

/** Prefer the endpoint that matches how the session was created (web = org admin). */
function refreshEndpoints(): string[] {
  const orgPath = "/api/v1/organizations/refresh-token";
  const userPath = "/api/v1/users/refresh-token";
  if (getOrganizationId()) {
    return [orgPath];
  }
  if (getAuthUser()) {
    return [userPath];
  }
  // Unknown session shape: try org first (web default), then employee.
  return [orgPath, userPath];
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    let rateLimited = false;
    for (const path of refreshEndpoints()) {
      const result = await tryRefreshWithEndpoint(path, refreshToken);
      if (result.token) return result.token;
      if (result.rateLimited) rateLimited = true;
    }

    if (rateLimited) {
      throw Object.assign(new Error("Too many refresh attempts. Please wait a moment and try again."), {
        status: 429,
      });
    }
    return null;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function toastApiError(status: number, message: string) {
  if (typeof window === "undefined") return;
  if (status === 404 || status === 400) return;
  toast.error(message);
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
  retry = true
): Promise<T> {
  const { body, headers, ...rest } = options;
  const accessToken = getAccessToken();
  if (!accessToken && typeof window !== "undefined" && endpoint.startsWith("/api/v1/")) {
    console.warn(`[apiClient] No access token for request: ${endpoint}`);
  }
  const res = await fetch(`${requireApiBaseUrl()}${endpoint}`, {
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
      const status = (e as { status?: number })?.status;
      if (status === 429) {
        const msg = e instanceof Error ? e.message : "Too many requests. Please wait and try again.";
        toastApiError(429, msg);
        throw e instanceof Error ? e : new Error(msg);
      }
      clearSession();
      const errorMsg = "Session expired. Please log in again.";
      if (typeof window !== "undefined") {
        toast.error(errorMsg);
        if (!window.location.pathname.startsWith("/sign-in")) {
          window.location.href = "/sign-in";
        }
      }
      throw new Error(errorMsg);
    }
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    const errorMessage =
      res.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : `Server error: ${res.status} ${res.statusText}`;
    toastApiError(res.status, errorMessage);
    throw Object.assign(new Error(errorMessage), { status: res.status });
  }

  if (!res.ok) {
    const errorMessage =
      res.status === 429
        ? data?.message || data?.error || "Too many requests. Please wait a moment and try again."
        : data?.message || data?.error || `API Error: ${res.status}`;
    toastApiError(res.status, typeof errorMessage === "string" ? errorMessage : `API Error: ${res.status}`);
    throw Object.assign(new Error(typeof errorMessage === "string" ? errorMessage : `API Error: ${res.status}`), {
      status: res.status,
    });
  }
  return data;
}
