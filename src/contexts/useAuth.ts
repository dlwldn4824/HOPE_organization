import { createContext, useContext } from 'react';
import type { SignupFormData } from '../types/auth';
import type { UserProfile } from '../types/home';

export interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (profile?: Partial<UserProfile>) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<void>;
  signupWithForm: (form: SignupFormData) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
