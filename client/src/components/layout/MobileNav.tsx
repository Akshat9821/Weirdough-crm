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

const items = [
  { to: '/orders', icon: IconClipboardList, label: 'Orders' },
  { to: '/employees', icon: IconUsers, label: 'Staff', ownerOnly: true },
  { to: '/inventory', icon: IconBox, label: 'Stock' },
  { to: '/customers', icon: IconHeart, label: 'Clients' },
  { to: '/analytics', icon: IconChartBar, label: 'Stats', ownerOnly: true },
];

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const hasUnread = useOrdersStore((s) => s.hasUnread);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-brand-brown/10 bg-brand-card md:hidden">
      {items
        .filter((i) => !i.ownerOnly || user?.role === 'OWNER')
        .map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center py-2 text-[9px] ${
                isActive ? 'text-brand-amber' : 'text-brand-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
            {to === '/orders' && hasUnread && (
              <span className="absolute right-1/4 top-1 h-1.5 w-1.5 rounded-full bg-alert-red" />
            )}
          </NavLink>
        ))}
    </nav>
  );
}
