import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SignupFormData } from '../types/auth';
import type { UserProfile } from '../types/home';
import { authFetch, SESSION_EXPIRED_EVENT } from '../utils/authFetch';
import { AuthContext } from './useAuth';

interface AuthResponse {
  token: string;
  user: UserProfile;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const DEMO_USER: UserProfile = {
  uid: 'user-001',
  nickname: '지우',
  level: 1,
  exp: 0,
  maxExp: 100,
  star: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('hope_user');
    return saved ? (JSON.parse(saved) as UserProfile) : null;
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('hope_token'));

  const applySession = useCallback((nextUser: UserProfile, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    sessionStorage.setItem('hope_user', JSON.stringify(nextUser));

    if (nextToken) {
      sessionStorage.setItem('hope_token', nextToken);
    } else {
      sessionStorage.removeItem('hope_token');
    }
  }, []);

  const login = useCallback(
    (profile?: Partial<UserProfile>) => {
      applySession({ ...DEMO_USER, ...profile }, null);
    },
    [applySession],
  );

  const loginWithCredentials = useCallback(
    async (identifier: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const payload = (await response.json()) as Partial<AuthResponse> & { error?: string };

      if (!response.ok || !payload.user || !payload.token) {
        throw new Error(payload.error ?? '아이디 또는 비밀번호가 올바르지 않습니다.');
      }

      applySession(payload.user, payload.token);
    },
    [applySession],
  );

  const signupWithForm = useCallback(
    async (form: SignupFormData) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as Partial<AuthResponse> & { error?: string };

      if (!response.ok || !payload.user || !payload.token) {
        throw new Error(payload.error ?? '회원가입에 실패했습니다.');
      }

      applySession(payload.user, payload.token);
    },
    [applySession],
  );

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    if (sessionStorage.getItem('hope_token')) {
      const body: Record<string, unknown> = {};
      if (profile.nickname !== undefined) body.nickname = profile.nickname;
      if (profile.gender !== undefined) body.gender = profile.gender;
      if (Object.keys(body).length > 0) {
        try {
          await authFetch(`${API_BASE_URL}/api/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } catch {
          // best-effort — fall through to local update so the UI still responds
        }
      }
    }
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...profile };
      sessionStorage.setItem('hope_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('hope_user');
    sessionStorage.removeItem('hope_token');
  }, []);

  // Auto-logout when the server says our token is expired/invalid.
  useEffect(() => {
    const onExpired = () => {
      if (sessionStorage.getItem('hope_token')) logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: user !== null,
      login,
      loginWithCredentials,
      signupWithForm,
      updateProfile,
      logout,
    }),
    [user, token, login, loginWithCredentials, signupWithForm, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
