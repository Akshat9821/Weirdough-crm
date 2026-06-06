import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IconClock,
  IconCurrencyRupee,
  IconLoader,
  IconCheck,
  IconPlus,
} from '@tabler/icons-react';
import { api } from '../lib/api';
import { formatINR, formatISTRelative } from '../lib/format';
import { useOrdersStore } from '../stores/ordersStore';
import type { Order } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Badge, orderStatusVariant, orderStatusLabel } from '../components/ui/Badge';
import { NotificationBell } from '../components/layout/NotificationBell';
import { OrderDetail } from './orders/OrderDetail';
import { NewOrderModal } from './orders/NewOrderModal';

const FILTERS = ['all', 'pending', 'active', 'completed'];

export function OrdersPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [meta, setMeta] = useState({ pending: 0, inProgress: 0 });
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();

  const orders = useOrdersStore((s) => s.orders);
  const filter = useOrdersStore((s) => s.filter);
  const search = useOrdersStore((s) => s.search);
  const selectedId = useOrdersStore((s) => s.selectedId);
  const pulseIds = useOrdersStore((s) => s.pulseIds);
  const setOrders = useOrdersStore((s) => s.setOrders);
  const setFilter = useOrdersStore((s) => s.setFilter);
  const setSearch = useOrdersStore((s) => s.setSearch);
  const setSelected = useOrdersStore((s) => s.setSelected);
  const upsertOrder = useOrdersStore((s) => s.upsertOrder);
  const clearUnread = useOrdersStore((s) => s.clearUnread);

  const load = useCallback(async () => {
    const [ordersRes, statsRes, staffRes] = await Promise.all([
      api.get('/orders', { params: { status: filter, q: search || undefined } }),
      api.get('/orders/stats'),
      api.get('/employees', { params: { onShift: true } }),
    ]);
    setOrders(ordersRes.data.orders);
    setMeta(ordersRes.data.meta);
    setStats(statsRes.data);
    setStaff(staffRes.data);

    const select = searchParams.get('select');
    if (select) setSelected(select);
    else if (!selectedId && ordersRes.data.orders[0]) {
      setSelected(ordersRes.data.orders[0].id);
    }
  }, [filter, search, searchParams, setOrders, setSelected, selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  function handleSelect(order: Order) {
    setSelected(order.id);
    if (order.isNew) {
      api.patch(`/orders/${order.id}/seen`).then((r) => upsertOrder(r.data));
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col md:h-screen">
      <div className="flex items-center justify-between bg-brand-brown px-3 py-2 md:hidden">
        <div>
          <div className="font-display text-sm text-brand-cream">helloweirdough</div>
          <div className="text-[9px] text-brand-cream/30">bakery crm</div>
        </div>
        <NotificationBell />
      </div>

      <TopBar
        title="Orders"
        search={search}
        onSearchChange={setSearch}
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <IconPlus size={14} /> New Order
          </PrimaryButton>
        }
      />

      <div className="overflow-auto bg-brand-bg p-3">
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders as number}
            sub="Today in IST"
            icon={<IconClock size={12} />}
          />
          <StatCard
            label="Revenue"
            value={formatINR((stats.todayRevenue as number) ?? 0)}
            icon={<IconCurrencyRupee size={12} />}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress as number}
            sub={`${stats.readyForPickup ?? 0} ready for pickup`}
            icon={<IconLoader size={12} />}
          />
          <StatCard
            label="Completed"
            value={stats.completed as number}
            icon={<IconCheck size={12} />}
          />
        </div>

        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[14px] border border-brand-brown/10 bg-brand-card shadow-card md:flex-row">
          <div className="flex w-full flex-col border-b border-brand-brown/10 md:w-[220px] md:border-b-0 md:border-r">
            <div className="flex items-center justify-between border-b border-brand-brown/10 px-2.5 py-2">
              <span className="text-[9px] font-medium uppercase tracking-wide text-brand-muted">
                Today's orders
              </span>
              {orders.some((o) => o.isNew) && (
                <Badge variant="red">{orders.filter((o) => o.isNew).length} new</Badge>
              )}
            </div>
            <div className="flex gap-1 border-b border-brand-brown/10 px-2.5 py-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-2 py-0.5 text-[9.5px] capitalize ${
                    filter === f
                      ? 'border-[#EF9F27] bg-badge-amber-bg text-badge-amber-text'
                      : 'border-brand-brown/10 text-brand-muted'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-auto md:max-h-none md:flex-1">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelect(o)}
                  className={`w-full border-b border-brand-brown/10 px-2.5 py-2 text-left ${
                    o.isNew ? 'border-l-[2.5px] border-l-alert-red bg-[#FFF3E0]' : ''
                  } ${selectedId === o.id ? 'border-l-[2.5px] border-l-brand-amber bg-[#FFF8ED]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-medium">{o.displayId}</span>
                    {o.isNew ? (
                      <Badge variant="red" className={pulseIds.has(o.id) ? 'animate-pulse-new' : ''}>
                        New
                      </Badge>
                    ) : (
                      <Badge variant={orderStatusVariant(o.status)}>
                        {orderStatusLabel(o.status)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-brand-muted">{o.customer.name}</div>
                  <div className="truncate text-[10px] text-brand-muted">{o.itemsSummary}</div>
                  <div className="mt-0.5 text-[9px] text-brand-muted">
                    {formatISTRelative(o.createdAt)} · {formatINR(o.total)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden flex-1 flex-col md:flex">
            {selected ? (
              <OrderDetail
                order={selected}
                staff={staff}
                onUpdate={(o) => {
                  upsertOrder(o);
                  if (!orders.some((x) => x.isNew)) clearUnread();
                }}
              />
            ) : (
              <p className="p-4 text-sm text-brand-muted">Select an order</p>
            )}
          </div>
        </div>

        <div className="mt-2.5 rounded-[12px] border border-brand-brown/10 bg-brand-card md:hidden">
          {selected && (
            <OrderDetail
              order={selected}
              staff={staff}
              onUpdate={(o) => upsertOrder(o)}
            />
          )}
        </div>

        <div className="mt-2.5 hidden overflow-hidden rounded-[12px] border border-brand-brown/10 bg-brand-card lg:block">
          <div className="flex items-center justify-between border-b border-brand-brown/10 px-3 py-2">
            <span className="text-xs font-medium">Recent orders</span>
            <div className="flex gap-1">
              <Badge variant="amber">{meta.pending} pending</Badge>
              <Badge variant="blue">{meta.inProgress} in progress</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-[11.5px]">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-wide text-brand-muted">
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                    <th key={h} className="border-b border-brand-brown/10 px-3 py-1.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer hover:bg-brand-bg"
                    onClick={() => handleSelect(o)}
                  >
                    <td className="border-b border-brand-brown/10 px-3 py-2 font-medium">
                      {o.displayId}
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {o.customer.name}
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">{o.itemsSummary}</td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {formatINR(o.total)}
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      <Badge variant={orderStatusVariant(o.status)}>
                        {orderStatusLabel(o.status)}
                      </Badge>
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {formatISTRelative(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <NewOrderModal onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </div>
  );
}
