import { useEffect, useState } from 'react';
import {
  IconPlus,
  IconBox,
  IconAlertTriangle,
  IconCurrencyRupee,
  IconTrendingUp,
  IconBread,
  IconCookie,
  IconCake,
} from '@tabler/icons-react';
import { api } from '../lib/api';
import { formatINR } from '../lib/format';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Badge } from '../components/ui/Badge';
import { avatarColor } from '../lib/format';

function ProductIcon({ category }: { category: string }) {
  const c = avatarColor(category);
  const Icon =
    category.includes('CAKE') ? IconCake : category.includes('MUFFIN') || category.includes('PASTRY') ? IconCookie : IconBread;
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-md"
      style={{ background: c.bg, color: c.text }}
    >
      <Icon size={14} />
    </div>
  );
}

export function InventoryPage() {
  const [products, setProducts] = useState<
    { id: string; name: string; category: string; stock: number; unit: string; lowStock: boolean }[]
  >([]);
  const [materials, setMaterials] = useState<
    { id: string; name: string; stock: number; unit: string; minRequired: number; status: string }[]
  >([]);
  const [stats, setStats] = useState<{
    totalSkus: number;
    lowStock: number;
    stockValue: number;
    topSeller: { name: string; sold: number };
  }>({ totalSkus: 0, lowStock: 0, stockValue: 0, topSeller: { name: '—', sold: 0 } });

  useEffect(() => {
    api.get('/inventory/stats').then((r) => setStats(r.data));
    api.get('/inventory/products').then((r) => setProducts(r.data));
    api.get('/inventory/materials').then((r) => setMaterials(r.data));
  }, []);

  function materialBadge(status: string) {
    if (status === 'OK') return <Badge variant="green">OK</Badge>;
    if (status === 'BORDERLINE') return <Badge variant="amber">Low</Badge>;
    return <Badge variant="red">Low</Badge>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Inventory"
        action={
          <PrimaryButton>
            <IconPlus size={14} /> Add Product
          </PrimaryButton>
        }
      />
      <div className="overflow-auto bg-brand-bg p-3">
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label="Total SKUs" value={stats.totalSkus} icon={<IconBox size={12} />} sub="8 categories" />
          <StatCard
            label="Low Stock"
            value={stats.lowStock}
            valueClassName="text-badge-red-text"
            icon={<IconAlertTriangle size={12} />}
            sub="Reorder needed"
          />
          <StatCard label="Stock Value" value={formatINR(stats.stockValue)} icon={<IconCurrencyRupee size={12} />} />
          <StatCard
            label="Top Seller"
            value={<span className="text-xs">{stats.topSeller.name}</span>}
            sub={`${stats.topSeller.sold} sold this week`}
            icon={<IconTrendingUp size={12} />}
          />
        </div>
        <div className="mb-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-brand-brown/10 bg-brand-card px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <ProductIcon category={p.category} />
                <div>
                  <div className="text-[11.5px] font-medium">{p.name}</div>
                  <div className="text-[10px] capitalize text-brand-muted">
                    {p.category.replace(/_/g, ' ').toLowerCase()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${p.lowStock ? 'text-badge-red-text' : ''}`}
                >
                  {p.stock}
                </div>
                <div className="text-[10px] text-brand-muted">{p.unit}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-[12px] border border-brand-brown/10 bg-brand-card">
          <div className="flex items-center justify-between border-b border-brand-brown/10 px-3 py-2">
            <span className="text-xs font-medium">Raw materials</span>
            <Badge variant="red">{materials.filter((m) => m.status !== 'OK').length} items low</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-[9.5px] uppercase text-brand-muted">
                  {['Material', 'Stock', 'Min. required', 'Status'].map((h) => (
                    <th key={h} className="border-b border-brand-brown/10 px-3 py-1.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="border-b border-brand-brown/10 px-3 py-2">{m.name}</td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {m.stock} {m.unit}
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {m.minRequired} {m.unit}
                    </td>
                    <td className="border-b border-brand-brown/10 px-3 py-2">
                      {materialBadge(m.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
