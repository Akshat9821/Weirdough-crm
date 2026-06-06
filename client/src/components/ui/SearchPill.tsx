import { IconSearch } from '@tabler/icons-react';

export function SearchPill({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-brand-brown/10 bg-brand-bg px-2.5 py-1 text-[11px] text-brand-muted">
      <IconSearch size={14} />
      <input
        className="w-24 border-0 bg-transparent outline-none sm:w-32"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
