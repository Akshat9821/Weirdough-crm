import { create } from 'zustand';
import { api } from '../lib/api';
import type { StaffNotification } from '../types';

interface NotificationState {
  items: StaffNotification[];
  fetch: () => Promise<void>;
  add: (n: StaffNotification) => void;
  markRead: (id: string) => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],

  fetch: async () => {
    const { data } = await api.get('/notifications');
    set({ items: data });
  },

  add: (n) => set((s) => ({ items: [n, ...s.items] })),

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
    }));
  },

  unreadCount: () => get().items.filter((i) => !i.read).length,
}));
