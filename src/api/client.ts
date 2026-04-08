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

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isRefreshEndpoint = original?.url?.includes("/auth/refresh/");

    if (error.response?.status === 401 && !original?._retry && !isRefreshEndpoint) {
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
            original.headers!.Authorization = `Bearer ${token}`;
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
        original.headers!.Authorization = `Bearer ${data.access}`;
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
