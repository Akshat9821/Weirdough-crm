import { CustomerTier, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function computeLifetimeSpend(customerId: string): Promise<number> {
  const agg = await prisma.order.aggregate({
    where: {
      customerId,
      status: { in: ['DELIVERED', 'READY', 'IN_PROGRESS'] },
    },
    _sum: { total: true },
  });
  return agg._sum.total ?? 0;
}

export function tierFromSpend(spend: number, orderCount: number): CustomerTier {
  if (spend >= 2000) return 'VIP';
  if (orderCount >= 2) return 'ACTIVE';
  return 'NEW';
}

export async function refreshCustomerTier(customerId: string) {
  const orderCount = await prisma.order.count({
    where: { customerId, status: { not: 'CANCELLED' } },
  });
  const spend = await computeLifetimeSpend(customerId);
  const tier = tierFromSpend(spend, orderCount);
  await prisma.customer.update({ where: { id: customerId }, data: { tier } });
  return tier;
}

export type CustomerWithMeta = Prisma.CustomerGetPayload<object> & {
  orderCount: number;
  lifetimeSpend: number;
};
