import { OrderStatus, ProgressStep } from '@prisma/client';

export function formatOrderId(orderNumber: number) {
  return `#HWD-${orderNumber}`;
}

export function itemsSummary(
  items: { qty: number; product: { name: string } }[]
): string {
  return items
    .map((i) => `${i.product.name} ×${i.qty}`)
    .join(', ');
}

const STATUS_FILTER: Record<string, OrderStatus[] | undefined> = {
  pending: ['PENDING'],
  active: ['IN_PROGRESS', 'READY'],
  completed: ['DELIVERED', 'CANCELLED'],
};

export function statusesForFilter(filter?: string): OrderStatus[] | undefined {
  if (!filter || filter === 'all') return undefined;
  return STATUS_FILTER[filter.toLowerCase()];
}

export function progressLabel(step: ProgressStep): string {
  const map: Record<ProgressStep, string> = {
    RECEIVED: 'Received',
    BAKING: 'Baking',
    PACKAGING: 'Pack',
    READY: 'Ready',
    PICKED_UP: 'Done',
  };
  return map[step];
}

export const PROGRESS_ORDER: ProgressStep[] = [
  'RECEIVED',
  'BAKING',
  'PACKAGING',
  'READY',
  'PICKED_UP',
];

export function nextProgressStep(current: ProgressStep): ProgressStep | null {
  const idx = PROGRESS_ORDER.indexOf(current);
  if (idx < 0 || idx >= PROGRESS_ORDER.length - 1) return null;
  return PROGRESS_ORDER[idx + 1];
}
