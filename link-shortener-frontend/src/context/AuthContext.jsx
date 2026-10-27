import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await authApi.getProfile();
          setUser(res.data);
        } catch (e) {
          // try refresh if possible
          if (refreshToken) {
            try {
              const r = await authApi.refresh(refreshToken);
              const newToken = r.data.token || r.data.accessToken;
              const newRefresh = r.data.refreshToken;
              if (newToken) {
                localStorage.setItem('token', newToken);
                setToken(newToken);
              }
              if (newRefresh) {
                localStorage.setItem('refreshToken', newRefresh);
                setRefreshToken(newRefresh);
              }
              const res = await authApi.getProfile();
              setUser(res.data);
            } catch (err) {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setToken(null);
              setRefreshToken(null);
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const t = res.data.token || res.data.accessToken;
    const rt = res.data.refreshToken;
    if (t) {
      localStorage.setItem('token', t);
      setToken(t);
    }
    if (rt) {
      localStorage.setItem('refreshToken', rt);
      setRefreshToken(rt);
    }
    if (res.data.user) {
      setUser(res.data.user);
    } else {
      try {
        const p = await authApi.getProfile();
        setUser(p.data);
      } catch {}
    }
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await authApi.register({ email, password, name });
    const t = res.data.token || res.data.accessToken;
    const rt = res.data.refreshToken;
    if (t) {
      localStorage.setItem('token', t);
      setToken(t);
    }
    if (rt) {
      localStorage.setItem('refreshToken', rt);
      setRefreshToken(rt);
    }
    if (res.data.user) {
      setUser(res.data.user);
    } else {
      try {
        const p = await authApi.getProfile();
        setUser(p.data);
      } catch {}
    }
    return res.data;
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const value = { user, token, refreshToken, loading, login, register, logout, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
