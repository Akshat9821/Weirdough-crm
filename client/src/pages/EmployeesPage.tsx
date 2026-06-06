import { useEffect, useState } from 'react';
import { IconPlus, IconUsers, IconClock, IconStar, IconCalendar } from '@tabler/icons-react';
import { api } from '../lib/api';
import { roleLabel } from '../lib/format';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { SearchPill } from '../components/ui/SearchPill';

function statusVariant(status: string) {
  if (status === 'ON_SHIFT') return 'green' as const;
  if (status === 'ON_LEAVE') return 'amber' as const;
  return 'blue' as const;
}

function statusLabel(status: string) {
  if (status === 'ON_SHIFT') return 'On shift';
  if (status === 'ON_LEAVE') return 'On leave';
  return 'Evening';
}

export function EmployeesPage() {
  const [list, setList] = useState<
    {
      id: string;
      name: string;
      employeeRole: string;
      shift: string;
      status: string;
      rating: number;
      experienceYears: number;
    }[]
  >([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/employees/stats').then((r) => setStats(r.data));
  }, []);

  useEffect(() => {
    api.get('/employees', { params: { q: q || undefined } }).then((r) => setList(r.data));
  }, [q]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Employees"
        action={
          <PrimaryButton>
            <IconPlus size={14} /> Add Employee
          </PrimaryButton>
        }
      />
      <div className="flex justify-end px-3 pt-2 md:hidden">
        <SearchPill value={q} onChange={setQ} />
      </div>
      <div className="overflow-auto bg-brand-bg p-3">
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label="Total Staff" value={stats.totalStaff} icon={<IconUsers size={12} />} sub="2 on leave today" />
          <StatCard label="On Shift" value={stats.onShift} icon={<IconClock size={12} />} />
          <StatCard label="Avg Rating" value={stats.avgRating} icon={<IconStar size={12} />} sub="Based on reviews" />
          <StatCard label="Open Slots" value={stats.openSlots} icon={<IconCalendar size={12} />} sub="This weekend" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <div
              key={e.id}
              className="rounded-[11px] border border-brand-brown/10 bg-brand-card p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Avatar name={e.name} />
                <div className="flex-1">
                  <div className="text-xs font-medium">{e.name}</div>
                  <div className="text-[10px] text-brand-muted">{roleLabel(e.employeeRole)}</div>
                </div>
                <Badge variant={statusVariant(e.status)}>{statusLabel(e.status)}</Badge>
              </div>
              <div className="flex gap-3 border-t border-brand-brown/10 pt-2 text-[10px] text-brand-muted">
                <div>
                  <span className="block text-xs font-medium text-brand-text">
                    {e.experienceYears} yrs
                  </span>
                  Exp
                </div>
                <div>
                  <span className="block text-xs font-medium text-brand-text capitalize">
                    {e.shift?.toLowerCase() ?? '—'}
                  </span>
                  Shift
                </div>
                <div>
                  <span className="block text-xs font-medium text-brand-text">{e.rating}★</span>
                  Rating
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
