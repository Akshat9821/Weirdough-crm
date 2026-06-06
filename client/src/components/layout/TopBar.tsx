import type { ReactNode } from 'react';
import { SearchPill } from '../ui/SearchPill';

export function TopBar({
  title,
  search,
  onSearchChange,
  action,
}: {
  title: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  action?: ReactNode;
}) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-brand-brown/10 bg-brand-card px-3.5">
      <h1 className="text-[13.5px] font-medium">{title}</h1>
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <SearchPill value={search ?? ''} onChange={onSearchChange} />
        )}
        {action}
      </div>
    </header>
  );
}
