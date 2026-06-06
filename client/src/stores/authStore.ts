import { create } from 'zustand';
import { api, setAuthToken } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuthToken(data.token);
    set({ user: data.user, loading: false });
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('hwd_token');
    if (!token) {
      set({ loading: false, user: null });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      setAuthToken(null);
      set({ user: null, loading: false });
    }
  },
}));
