type Variant = 'green' | 'amber' | 'red' | 'blue';

const styles: Record<Variant, string> = {
  green: 'bg-badge-green-bg text-badge-green-text',
  amber: 'bg-badge-amber-bg text-badge-amber-text',
  red: 'bg-badge-red-bg text-badge-red-text',
  blue: 'bg-badge-blue-bg text-badge-blue-text',
};

export function orderStatusVariant(status: string): Variant {
  switch (status) {
    case 'PENDING':
      return 'amber';
    case 'IN_PROGRESS':
      return 'blue';
    case 'READY':
    case 'DELIVERED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    default:
      return 'amber';
  }
}

export function orderStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Badge({
  children,
  variant = 'amber',
  className = '',
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
