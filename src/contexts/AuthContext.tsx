import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserProfile } from '../types/home';

interface AuthContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (profile?: Partial<UserProfile>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

const MOCK_USER: UserProfile = {
  uid: 'user-001',
  nickname: '지우',
  level: 12,
  exp: 320,
  maxExp: 500,
  star: 1250,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('hope_user');
    return saved ? (JSON.parse(saved) as UserProfile) : null;
  });

  const login = useCallback((profile?: Partial<UserProfile>) => {
    const next = { ...MOCK_USER, ...profile };
    setUser(next);
    sessionStorage.setItem('hope_user', JSON.stringify(next));
  }, []);

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...profile };
      sessionStorage.setItem('hope_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('hope_user');
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      login,
      updateProfile,
      logout,
    }),
    [user, login, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
