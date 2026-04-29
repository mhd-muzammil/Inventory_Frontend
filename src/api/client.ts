import axios from "axios";
import { tokenStore } from "./tokenStore";

/**
 * Extracts a human-readable error message from any thrown axios error.
 * Checks detail, error, message fields, then falls back to first field error.
 */
export function extractApiError(err: unknown): string {
  if (!err || typeof err !== "object") return "An error occurred";
  const data = (err as { response?: { data?: unknown } }).response?.data;
  if (!data) return (err as { message?: string }).message ?? "Network error";
  if (typeof data === "string") return data;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  if (typeof d.error === "string") return d.error;
  if (typeof d.message === "string") return d.message;
  for (const val of Object.values(d)) {
    if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  }
  return "An error occurred";
}

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];
let refreshPromise: Promise<string | null> | null = null;

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh-token");
  if (!refresh) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<{ access: string }>(`${import.meta.env.VITE_API_URL || "/api"}/auth/refresh/`, { refresh })
    .then(({ data }) => {
      tokenStore.setAccess(data.access);
      return data.access;
    })
    .catch(() => {
      tokenStore.clear();
      localStorage.removeItem("refresh-token");
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

client.interceptors.request.use(async (config) => {
  let token = tokenStore.getAccess();
  const url = config.url || "";
  const isAuthCall = url.includes("/auth/login/") || url.includes("/auth/register/") || url.includes("/auth/refresh/");

  if (!token && !isAuthCall && localStorage.getItem("refresh-token")) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isRefreshEndpoint = original?.url?.includes("/auth/refresh/");

    // Skip interceptor for login endpoint — let the caller handle auth errors
    const isLoginEndpoint = original?.url?.includes("/auth/login/");

    if (error.response?.status === 401 && !original?._retry && !isRefreshEndpoint && !isLoginEndpoint) {
      const refresh = localStorage.getItem("refresh-token");

      if (!refresh) {
        // No refresh token — force re-login
        import("@/store/authStore").then(({ useAuthStore }) =>
          useAuthStore.getState().logout()
        );
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ access: string }>(
          `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh/`,
          { refresh },
        );
        tokenStore.setAccess(data.access);
        drainQueue(data.access);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch {
        tokenStore.clear();
        localStorage.removeItem("refresh-token");
        import("@/store/authStore").then(({ useAuthStore }) =>
          useAuthStore.getState().logout()
        );
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
