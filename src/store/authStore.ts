import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// localStorage 직접 사용
const loadAuth = (): { token: string | null; user: User | null } => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { token: parsed.token || null, user: parsed.user || null };
    }
  } catch {
    // ignore
  }
  return { token: null, user: null };
};

const saveAuth = (token: string | null, user: User | null) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify({ token, user }));
  } catch {
    // ignore
  }
};

const clearAuth = () => {
  try {
    localStorage.removeItem('auth-storage');
  } catch {
    // ignore
  }
};

const { token: initialToken, user: initialUser } = loadAuth();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: !!initialToken && !!initialUser,
  login: (token, user) => {
    saveAuth(token, user);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    clearAuth();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

