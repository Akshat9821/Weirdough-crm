import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '../lib/api';
import { formatINR } from '../lib/format';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';

const COLORS = ['#3B1F0A', '#E8A040', '#854F0B', '#3B6D11', '#185FA5'];

export function AnalyticsPage() {
  const [data, setData] = useState<{
    monthlyRevenue: number;
    ordersThisMonth: number;
    fulfillmentRate: number;
    avgRating: number;
    revenueByCategory: { name: string; revenue: number }[];
    staffPerformance: {
      name: string;
      ordersHandled: number;
      avgFulfillmentMins: number;
      rating: number;
    }[];
  } | null>(null);

  useEffect(() => {
    api.get('/analytics').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="p-4 text-sm text-brand-muted">Loading…</div>;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Analytics" />
      <div className="overflow-auto bg-brand-bg p-3">
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label="Monthly revenue" value={formatINR(data.monthlyRevenue)} />
          <StatCard label="Orders this month" value={data.ordersThisMonth} />
          <StatCard label="Fulfillment rate" value={`${data.fulfillmentRate}%`} />
          <StatCard label="Avg rating" value={data.avgRating} />
        </div>

        <div className="mb-2.5 rounded-[12px] border border-brand-brown/10 bg-brand-card p-4">
          <h3 className="mb-3 text-xs font-medium">Revenue by category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueByCategory} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
              <Bar dataKey="revenue" radius={4}>
                {data.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-brand-brown/10 bg-brand-card">
          <div className="border-b border-brand-brown/10 px-3 py-2 text-xs font-medium">
            Staff performance
          </div>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-left text-[9.5px] uppercase text-brand-muted">
                {['Name', 'Orders handled', 'Avg fulfillment', 'Rating'].map((h) => (
                  <th key={h} className="border-b border-brand-brown/10 px-3 py-1.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.staffPerformance.map((s) => (
                <tr key={s.name}>
                  <td className="border-b border-brand-brown/10 px-3 py-2">{s.name}</td>
                  <td className="border-b border-brand-brown/10 px-3 py-2">{s.ordersHandled}</td>
                  <td className="border-b border-brand-brown/10 px-3 py-2">
                    {s.avgFulfillmentMins} min
                  </td>
                  <td className="border-b border-brand-brown/10 px-3 py-2">{s.rating}★</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
