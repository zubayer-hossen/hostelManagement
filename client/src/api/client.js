import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

/** Access token lives in memory only (never localStorage) — the HTTP-only refresh cookie restores it after a reload. */
let accessToken = null;
export const tokenStore = {
  get: () => accessToken,
  set: (t) => { accessToken = t; },
  clear: () => { accessToken = null; },
};

export const SESSION_FLAG = 'dhms_session';
export const AUTH_LOGOUT_EVENT = 'dhms:auth-logout';

export const api = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

// A bare instance (no interceptors) for the refresh call so it can never recurse.
const bare = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

let refreshPromise = null;
/** Single-flight refresh: concurrent 401s share one refresh request. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = bare
      .post('/auth/refresh')
      .then((res) => {
        const { accessToken: token, user } = res.data.data;
        tokenStore.set(token);
        return { token, user };
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const NO_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip = !original || original._retry || NO_RETRY.some((p) => original.url?.includes(p));

    if (status === 401 && !skip) {
      original._retry = true;
      try {
        const { token } = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        tokenStore.clear();
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/** Unwraps the { success, message, data } envelope. */
export const unwrap = (promise) => promise.then((res) => res.data);
