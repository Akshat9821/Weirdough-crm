import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  sub,
  icon,
  valueClassName = '',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[10px] border border-brand-brown/10 bg-brand-card px-3 py-2.5">
      <div className="mb-0.5 flex items-center gap-1 text-[10px] text-brand-muted">
        {icon}
        {label}
      </div>
      <div className={`text-[17px] font-medium ${valueClassName}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-brand-muted">{sub}</div>}
    </div>
  );
}
