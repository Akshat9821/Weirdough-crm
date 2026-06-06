import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/format';
import { Modal } from '../../components/ui/Modal';

export function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [requestedAt, setRequestedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([
    { productId: '', qty: 1 },
  ]);

  useEffect(() => {
    api.get('/customers').then((r) => setCustomers(r.data));
    api.get('/inventory/products').then((r) => setProducts(r.data));
    const d = new Date();
    d.setHours(d.getHours() + 2);
    setRequestedAt(d.toISOString().slice(0, 16));
  }, []);

  const total = lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId);
    return sum + (p?.price ?? 0) * l.qty;
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const items = lines.filter((l) => l.productId && l.qty > 0);
    if (!customerId || !items.length) return;
    await api.post('/orders', {
      customerId,
      type,
      requestedAt: new Date(requestedAt).toISOString(),
      notes: notes || undefined,
      items,
    });
    onCreated();
    onClose();
  }

  return (
    <Modal title="New order" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <label className="block text-xs text-brand-muted">
          Customer
          <select
            className="mt-1 w-full rounded-lg border px-2 py-1.5"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <select
              className="flex-1 rounded border px-2 py-1"
              value={line.productId}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...line, productId: e.target.value };
                setLines(next);
              }}
            >
              <option value="">Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="w-16 rounded border px-2"
              value={line.qty}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...line, qty: Number(e.target.value) };
                setLines(next);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-xs text-brand-amber"
          onClick={() => setLines([...lines, { productId: '', qty: 1 }])}
        >
          + Add item
        </button>
        <div className="flex gap-2">
          <label className="flex-1 text-xs">
            Type
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={type}
              onChange={(e) => setType(e.target.value as 'PICKUP' | 'DELIVERY')}
            >
              <option value="PICKUP">Pickup</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </label>
          <label className="flex-1 text-xs">
            Ready by
            <input
              type="datetime-local"
              className="mt-1 w-full rounded border px-2 py-1"
              value={requestedAt}
              onChange={(e) => setRequestedAt(e.target.value)}
              required
            />
          </label>
        </div>
        <textarea
          className="w-full rounded border p-2 text-xs"
          placeholder="Special notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="font-medium">Total: {formatINR(total)}</div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-amber py-2 font-medium text-brand-brown"
        >
          Create order
        </button>
      </form>
    </Modal>
  );
}
