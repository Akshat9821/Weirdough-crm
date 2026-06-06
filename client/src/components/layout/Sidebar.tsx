import { NavLink } from 'react-router-dom';
import {
  IconClipboardList,
  IconUsers,
  IconBox,
  IconHeart,
  IconChartBar,
} from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { Avatar } from '../ui/Avatar';
import { roleLabel } from '../../lib/format';

const nav = [
  { to: '/orders', label: 'Orders', icon: IconClipboardList },
  { to: '/employees', label: 'Employees', icon: IconUsers, ownerOnly: true },
  { to: '/inventory', label: 'Inventory', icon: IconBox },
  { to: '/customers', label: 'Customers', icon: IconHeart },
  { to: '/analytics', label: 'Analytics', icon: IconChartBar, ownerOnly: true },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const hasUnread = useOrdersStore((s) => s.hasUnread);

  return (
    <aside className="hidden h-screen w-[200px] shrink-0 flex-col bg-brand-brown md:flex">
      <div className="border-b border-white/5 px-3.5 py-4">
        <div className="font-display text-[12.5px] font-medium text-brand-cream">
          helloweirdough
        </div>
        <div className="text-[9px] text-brand-cream/30">bakery crm</div>
      </div>
      <nav className="flex-1 py-2">
        <div className="px-3.5 pb-1 text-[8.5px] uppercase tracking-widest text-brand-cream/20">
          Main
        </div>
        {nav
          .filter((n) => !n.ownerOnly || user?.role === 'OWNER')
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 border-l-2 px-3.5 py-2 text-[11.5px] ${
                  isActive
                    ? 'border-brand-amber bg-brand-amber/10 text-brand-cream'
                    : 'border-transparent text-brand-cream/40 hover:text-brand-cream/70'
                }`
              }
            >
              <Icon size={16} />
              {label}
              {to === '/orders' && hasUnread && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-alert-red" />
              )}
            </NavLink>
          ))}
      </nav>
      {user && (
        <div className="flex items-center gap-2 border-t border-white/5 px-3.5 py-3">
          <Avatar name={user.name} size={32} />
          <div className="min-w-0">
            <div className="truncate text-[11px] text-brand-cream">{user.name}</div>
            <div className="text-[9px] text-brand-cream/35 capitalize">
              {user.role === 'OWNER' ? 'Owner' : roleLabel(user.employeeRole)}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
