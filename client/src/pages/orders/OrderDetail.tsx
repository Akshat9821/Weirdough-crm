import {
  IconUser,
  IconShoppingBag,
  IconProgress,
  IconBell,
  IconBread,
  IconCookie,
  IconCake,
} from '@tabler/icons-react';
import { api } from '../../lib/api';
import { formatINR, formatIST } from '../../lib/format';
import type { Order } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const STEPS = ['RECEIVED', 'BAKING', 'PACKAGING', 'READY', 'PICKED_UP'] as const;
const STEP_LABELS = ['Received', 'Baking', 'Pack', 'Ready', 'Done'];

function productIcon(category: string) {
  if (category.includes('CAKE')) return IconCake;
  if (category.includes('MUFFIN') || category.includes('PASTRY')) return IconCookie;
  return IconBread;
}

export function OrderDetail({
  order,
  staff,
  onUpdate,
}: {
  order: Order;
  staff: { id: string; name: string }[];
  onUpdate: (o: Order) => void;
}) {
  const stepIdx = STEPS.indexOf(order.progressStep as (typeof STEPS)[number]);

  async function accept() {
    const { data } = await api.post(`/orders/${order.id}/accept`);
    onUpdate(data);
  }

  async function decline() {
    const { data } = await api.post(`/orders/${order.id}/decline`);
    onUpdate(data);
  }

  async function advance() {
    const { data } = await api.patch(`/orders/${order.id}/progress`);
    onUpdate(data);
  }

  async function assign(userId: string) {
    const { data } = await api.patch(`/orders/${order.id}/assign`, {
      assignedToId: userId || null,
    });
    onUpdate(data);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-brand-bg">
      {order.isNew && order.status === 'PENDING' && (
        <div className="flex flex-wrap items-start gap-2 bg-brand-brown px-3.5 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-amber">
            <IconBell size={14} className="text-brand-brown" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium text-brand-cream">
              New order — {order.displayId}
            </div>
            <div className="text-[9.5px] text-brand-cream/40">
              {order.customer.name} · via {order.source}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={decline}
              className="rounded-md border border-white/15 px-2.5 py-1 text-[10.5px] text-brand-cream"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={accept}
              className="rounded-md bg-brand-amber px-2.5 py-1 text-[10.5px] font-medium text-brand-brown"
            >
              Accept order
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 p-2.5">
        <div className="overflow-hidden rounded-[10px] border border-brand-brown/10 bg-brand-card">
          <div className="flex items-center justify-between border-b border-brand-brown/10 px-2.5 py-2">
            <span className="flex items-center gap-1 text-[10.5px] font-medium">
              <IconUser size={12} className="text-brand-muted" /> Customer
            </span>
            <Badge variant="blue">{order.customerType === 'new' ? 'New' : 'Returning'}</Badge>
          </div>
          <div className="p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <Avatar name={order.customer.name} size={28} />
              <div>
                <div className="text-[11.5px] font-medium">{order.customer.name}</div>
                <div className="text-[9.5px] text-brand-muted">
                  {order.customer.phone} · {order.customer.location ?? 'Faridabad'}
                </div>
              </div>
            </div>
            <Row label="Order type" value={order.type === 'PICKUP' ? 'Pickup' : 'Delivery'} />
            <Row label="Ready by" value={formatIST(order.requestedAt)} />
            {order.notes && (
              <Row label="Note" value={order.notes} valueClass="text-badge-amber-text text-[10px]" />
            )}
            <label className="mt-2 block text-[10px] text-brand-muted">
              Assign to
              <select
                className="mt-0.5 w-full rounded border border-brand-brown/10 px-2 py-1 text-[11px]"
                value={order.assignedToId ?? ''}
                onChange={(e) => assign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-brand-brown/10 bg-brand-card">
          <div className="border-b border-brand-brown/10 px-2.5 py-2 text-[10.5px] font-medium">
            <IconShoppingBag size={12} className="mr-1 inline text-brand-muted" />
            Items
          </div>
          <div className="px-2.5 pt-1">
            {order.items.map((item) => {
              const Icon = productIcon(item.product.category);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 border-b border-brand-brown/10 py-1.5 last:border-0"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-badge-amber-bg text-badge-amber-text">
                    <Icon size={12} />
                  </div>
                  <span className="flex-1 text-[10.5px]">{item.product.name}</span>
                  <span className="text-[10px] text-brand-muted">×{item.qty}</span>
                  <span className="text-[10.5px] font-medium">
                    {formatINR(item.unitPrice * item.qty)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between border-t border-brand-brown/10 px-2.5 py-2">
            <span className="text-[11.5px] font-medium">Total</span>
            <span className="text-[12.5px] font-medium text-badge-amber-text">
              {formatINR(order.total)}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-brand-brown/10 bg-brand-card">
          <div className="border-b border-brand-brown/10 px-2.5 py-2 text-[10.5px] font-medium">
            <IconProgress size={12} className="mr-1 inline text-brand-muted" />
            Progress
          </div>
          <div className="flex items-center px-2 py-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => i === stepIdx + 1 && advance()}
                    disabled={i !== stepIdx + 1}
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] ${
                      i < stepIdx
                        ? 'bg-brand-amber text-brand-brown'
                        : i === stepIdx
                          ? 'bg-brand-amber text-brand-brown'
                          : 'border border-brand-brown/10 bg-brand-bg text-brand-muted'
                    }`}
                  >
                    {i <= stepIdx ? '✓' : i + 1}
                  </button>
                  <span
                    className={`mt-0.5 text-[8px] ${i <= stepIdx ? 'font-medium text-badge-amber-text' : 'text-brand-muted'}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="mb-3 h-px w-3 bg-brand-brown/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between border-b border-brand-brown/10 py-1 text-[11px] last:border-0">
      <span className="text-brand-muted">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
