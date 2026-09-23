import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStore, refreshAccessToken, SESSION_FLAG, AUTH_LOGOUT_EVENT } from '../api/client.js';
import { authApi } from '../api/auth.js';
import { STAFF_ROLES } from '../constants/roles.js';

const AuthContext = createContext(null);

const setFlag = (on) => {
  try { on ? localStorage.setItem(SESSION_FLAG, '1') : localStorage.removeItem(SESSION_FLAG); } catch { /* ignore */ }
};
const hasFlag = () => {
  try { return localStorage.getItem(SESSION_FLAG) === '1'; } catch { return false; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => {
    tokenStore.clear();
    setFlag(false);
    setUser(null);
    setPermissions([]);
  }, []);

  /** Loads the authoritative user + effective permissions from the server. */
  const loadMe = useCallback(async () => {
    const res = await authApi.me();
    setUser(res.data.user);
    setPermissions(res.data.permissions);
    return res.data.user;
  }, []);

  // Restore the session after a page reload using the HTTP-only refresh cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasFlag()) { setLoading(false); return; }
      try {
        await refreshAccessToken();
        if (!cancelled) await loadMe();
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadMe, clear]);

  // The API layer emits this when a refresh fails (session revoked / expired).
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, clear);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clear);
  }, [clear]);

  const startSession = useCallback(async (accessToken) => {
    tokenStore.set(accessToken);
    setFlag(true);
    return loadMe();
  }, [loadMe]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    return startSession(res.data.accessToken);
  }, [startSession]);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    if (res.data.requiresVerification) return { requiresVerification: true };
    await startSession(res.data.accessToken);
    return { requiresVerification: false };
  }, [startSession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* cookie is cleared server-side when possible */ }
    clear();
  }, [clear]);

  const logoutAll = useCallback(async () => {
    try { await authApi.logoutAll(); } finally { clear(); }
  }, [clear]);

  const hasPermission = useCallback((p) => permissions.includes(p), [permissions]);

  const value = useMemo(
    () => ({
      user, permissions, loading,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user && STAFF_ROLES.includes(user.role)),
      login, register, logout, logoutAll, reloadUser: loadMe, hasPermission,
    }),
    [user, permissions, loading, login, register, logout, logoutAll, loadMe, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
