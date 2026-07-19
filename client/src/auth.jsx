import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api, setToken, getToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    api('/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const s = io('/', { auth: { token: getToken() } });
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
  }, [user?.id]);

  const value = useMemo(() => ({
    user,
    loading,
    socket,
    setUser,
    login: async (email, password, role) => {
      const { token, user: u } = await api('/auth/login', { method: 'POST', body: { email, password, role } });
      setToken(token);
      setUser(u);
      return u;
    },
    register: async (body) => {
      const { token, user: u } = await api('/auth/register', { method: 'POST', body });
      setToken(token);
      setUser(u);
      return u;
    },
    logout: () => { setToken(null); setUser(null); window.location.href = '/login'; },
  }), [user, loading, socket]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export const homeFor = (user) =>
  user?.role === 'doctor' ? '/doctor' : user?.role === 'admin' ? '/admin' : '/patient';
