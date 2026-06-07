import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { isDemoMode } from '../lib/demoMode';
import { useOrdersStore } from '../stores/ordersStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { Order, StaffNotification } from '../types';

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? '';

export function useOrderSocket() {
  const upsertOrder = useOrdersStore((s) => s.upsertOrder);
  const addNotif = useNotificationStore((s) => s.add);

  useEffect(() => {
    if (isDemoMode) return;
    const token = localStorage.getItem('hwd_token');
    if (!token) return;

    const socket = io(socketUrl || undefined, { auth: { token } });

    socket.on('order:new', (order: Order) => {
      upsertOrder(order);
    });

    socket.on('order:updated', (order: Order) => {
      upsertOrder(order);
    });

    socket.on('notification:new', (n: StaffNotification) => {
      addNotif(n);
    });

    return () => {
      socket.disconnect();
    };
  }, [upsertOrder, addNotif]);
}
