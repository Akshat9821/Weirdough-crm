import { create } from 'zustand';
import type { Order } from '../types';

interface OrdersState {
  orders: Order[];
  selectedId: string | null;
  filter: string;
  search: string;
  hasUnread: boolean;
  pulseIds: Set<string>;
  setOrders: (orders: Order[]) => void;
  upsertOrder: (order: Order) => void;
  setSelected: (id: string | null) => void;
  setFilter: (f: string) => void;
  setSearch: (s: string) => void;
  markPulse: (id: string) => void;
  clearUnread: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  selectedId: null,
  filter: 'all',
  search: '',
  hasUnread: false,
  pulseIds: new Set(),

  setOrders: (orders) =>
    set({
      orders,
      hasUnread: orders.some((o) => o.isNew),
    }),

  upsertOrder: (order) =>
    set((state) => {
      const exists = state.orders.findIndex((o) => o.id === order.id);
      const orders =
        exists >= 0
          ? state.orders.map((o) => (o.id === order.id ? order : o))
          : [order, ...state.orders];
      const pulseIds = new Set(state.pulseIds);
      if (order.isNew) pulseIds.add(order.id);
      return {
        orders,
        hasUnread: orders.some((o) => o.isNew),
        pulseIds,
      };
    }),

  setSelected: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  markPulse: (id) =>
    set((s) => ({ pulseIds: new Set(s.pulseIds).add(id) })),
  clearUnread: () => set({ hasUnread: false }),
}));
