import { useEffect, useState } from 'react';
import { IconPlus, IconHeart, IconRepeat, IconCurrencyRupee, IconCrown } from '@tabler/icons-react';
import { api } from '../lib/api';
import { formatINR } from '../lib/format';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

const TIERS = ['all', 'VIP', 'ACTIVE', 'NEW'];

function tierVariant(tier: string) {
  if (tier === 'VIP') return 'amber' as const;
  if (tier === 'ACTIVE') return 'green' as const;
  return 'blue' as const;
}

export function CustomersPage() {
  const [list, setList] = useState<
    {
      id: string;
      name: string;
      location?: string;
      tier: string;
      orderCount: number;
      lifetimeSpend: number;
    }[]
  >([]);
  const [stats, setStats] = useState({ total: 0, returning: 0, avgOrder: 0, vips: 0 });
  const [tier, setTier] = useState('all');

  useEffect(() => {
    api.get('/customers/stats').then((r) => setStats(r.data));
  }, []);

  useEffect(() => {
    api.get('/customers', { params: { tier: tier === 'all' ? undefined : tier } }).then((r) => setList(r.data));
  }, [tier]);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Customers"
        action={
          <PrimaryButton>
            <IconPlus size={14} /> Add
          </PrimaryButton>
        }
      />
      <div className="overflow-auto bg-brand-bg p-3">
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={<IconHeart size={12} />} sub="+18 this month" />
          <StatCard label="Returning" value={`${stats.returning}%`} icon={<IconRepeat size={12} />} />
          <StatCard label="Avg Order" value={formatINR(Math.round(stats.avgOrder))} icon={<IconCurrencyRupee size={12} />} />
          <StatCard label="VIPs" value={stats.vips} icon={<IconCrown size={12} />} sub="₹2000+ spend" />
        </div>
        <div className="mb-2 flex gap-1">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`rounded-full border px-2 py-0.5 text-[9.5px] ${
                tier === t
                  ? 'border-[#EF9F27] bg-badge-amber-bg text-badge-amber-text'
                  : 'border-brand-brown/10 text-brand-muted'
              }`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <div className="rounded-[12px] border border-brand-brown/10 bg-brand-card p-2.5">
          <div className="mb-2 text-xs font-medium">Top customers</div>
          {list.map((c) => (
            <div
              key={c.id}
              className="mb-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-brand-brown/10 px-3 py-2"
            >
              <Avatar name={c.name} />
              <div className="min-w-[90px] flex-1">
                <div className="text-xs font-medium">{c.name}</div>
                <div className="text-[10px] text-brand-muted">
                  {c.tier} · {c.location ?? 'Faridabad'}
                </div>
              </div>
              <div className="ml-auto flex gap-3 text-center text-[10px] text-brand-muted">
                <div>
                  <span className="block text-xs font-medium text-brand-text">{c.orderCount}</span>
                  Orders
                </div>
                <div>
                  <span className="block text-xs font-medium text-brand-text">
                    {formatINR(c.lifetimeSpend)}
                  </span>
                  Lifetime
                </div>
              </div>
              <Badge variant={tierVariant(c.tier)}>{c.tier}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
