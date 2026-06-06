import type { ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';

export function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-[14px] bg-brand-card shadow-card ${wide ? 'max-w-lg' : 'max-w-md'}`}
      >
        <div className="flex items-center justify-between border-b border-brand-brown/10 px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button type="button" onClick={onClose} className="text-brand-muted">
            <IconX size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
