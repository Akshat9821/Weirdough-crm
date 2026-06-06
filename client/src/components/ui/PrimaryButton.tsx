import type { ReactNode } from 'react';

export function PrimaryButton({
  children,
  onClick,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-[7px] bg-brand-amber px-2.5 py-1.5 text-[11px] font-medium text-brand-brown whitespace-nowrap ${className}`}
    >
      {children}
    </button>
  );
}
