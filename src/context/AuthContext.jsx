import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';
import { money as formatMoney } from '../lib/format';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setBusiness(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      setBusiness(data.business);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refresh();
    const onLogout = () => logout();
    window.addEventListener('nexo:logout', onLogout);
    return () => window.removeEventListener('nexo:logout', onLogout);
  }, [refresh, logout]);

  const applySession = (data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setBusiness(data.business);
  };

  const login = async (email, password) => applySession(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (payload) => applySession(await api('/auth/register', { method: 'POST', body: payload }));

  const value = useMemo(
    () => ({
      user,
      business,
      loading,
      login,
      register,
      logout,
      setUser,
      setBusiness,
      isOwner: user?.role === 'OWNER',
      isStaff: user?.role === 'OWNER' || user?.role === 'EMPLOYEE',
      isSeller: user?.role === 'SELLER',
      money: (v) => formatMoney(v, business?.currency || 'USD'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, business, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
