import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationBell } from './NotificationBell';
import { useOrderSocket } from '../../hooks/useOrderSocket';

export function AppLayout() {
  useOrderSocket();

  return (
    <div className="flex min-h-screen bg-brand-bg pb-14 md:pb-0">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="hidden items-center justify-end gap-2 border-b border-brand-brown/10 bg-brand-card px-3 py-1 md:flex">
          <NotificationBell />
        </div>
        <Outlet />
      </div>
      <MobileNav />
    </div>
  );
}
