import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORE_TOKEN_KEY = 'store_token';
const ADMIN_TOKEN_KEY = 'admin_token';

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getToken(key) {
  try {
    const t = localStorage.getItem(key);
    if (t && isTokenExpired(t)) {
      localStorage.removeItem(key);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

const StoreAuthContext = createContext();
const AdminAuthContext = createContext();

export function StoreAuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken(STORE_TOKEN_KEY));

  const login = useCallback((t) => {
    try { localStorage.setItem(STORE_TOKEN_KEY, t); } catch {}
    setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORE_TOKEN_KEY); } catch {}
    setTokenState(null);
  }, []);

  useEffect(() => {
    const t = getToken(STORE_TOKEN_KEY);
    setTokenState(t);
  }, []);

  return (
    <StoreAuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </StoreAuthContext.Provider>
  );
}

export function AdminAuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken(ADMIN_TOKEN_KEY));
  const [adminProfile, setAdminProfile] = useState(null);

  const login = useCallback((t, profile) => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, t);
      if (profile) {
        localStorage.setItem('admin_profile', JSON.stringify(profile));
      }
    } catch {}
    setTokenState(t);
    if (profile) setAdminProfile(profile);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem('admin_profile');
    } catch {}
    setTokenState(null);
    setAdminProfile(null);
  }, []);

  useEffect(() => {
    const t = getToken(ADMIN_TOKEN_KEY);
    setTokenState(t);
    try {
      const stored = localStorage.getItem('admin_profile');
      if (stored) setAdminProfile(JSON.parse(stored));
    } catch {}
  }, []);

  const adminRole = adminProfile?.role || 'admin';
  const adminPermissions = adminProfile?.permissions || [];

  return (
    <AdminAuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout, adminProfile, adminRole, adminPermissions }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useStoreAuth() {
  const ctx = useContext(StoreAuthContext);
  if (!ctx) return { token: null, isAuthenticated: false, login: () => {}, logout: () => {} };
  return ctx;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) return { token: null, isAuthenticated: false, login: () => {}, logout: () => {}, adminProfile: null, adminRole: 'viewer', adminPermissions: [] };
  return ctx;
}

export function StoreAuthGuard({ children }) {
  const { isAuthenticated } = useStoreAuth();
  if (!isAuthenticated) {
    window.location.href = '/store/login';
    return null;
  }
  return children;
}

export function AdminAuthGuard({ children }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    window.location.href = '/admin/login';
    return null;
  }
  return children;
}
