import { Outlet } from 'react-router-dom';
import { isDemoMode } from '../../lib/demoMode';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationBell } from './NotificationBell';
import { useOrderSocket } from '../../hooks/useOrderSocket';

export function AppLayout() {
  useOrderSocket();

  return (
    <div className="flex min-h-screen bg-brand-bg pb-14 md:pb-0">
      {isDemoMode && (
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-brown px-3 py-1 text-[10px] text-brand-cream shadow-card md:bottom-4">
          Demo mode · sample data only
        </div>
      )}
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
