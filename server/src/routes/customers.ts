import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { computeLifetimeSpend, refreshCustomerTier } from '../lib/customerTier.js';
import { formatOrderId } from '../lib/orderHelpers.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', async (_req, res) => {
  const customers = await prisma.customer.findMany();
  const total = customers.length;
  const vips = customers.filter((c) => c.tier === 'VIP').length;

  const orders = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { total: true, customerId: true },
  });
  const avgOrder = orders.length
    ? orders.reduce((s, o) => s + o.total, 0) / orders.length
    : 0;
  const returning =
    total > 0
      ? Math.round(
          (customers.filter((c) =>
            orders.filter((o) => o.customerId === c.id).length > 1
          ).length /
            total) *
            100
        )
      : 0;

  res.json({ total, returning, avgOrder, vips });
});

router.get('/', async (req, res) => {
  const tier = req.query.tier as string | undefined;
  const q = (req.query.q as string)?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      ...(tier && tier !== 'all' ? { tier: tier.toUpperCase() as 'VIP' | 'ACTIVE' | 'NEW' } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const orderCount = await prisma.order.count({
        where: { customerId: c.id, status: { not: 'CANCELLED' } },
      });
      const lifetimeSpend = await computeLifetimeSpend(c.id);
      return { ...c, orderCount, lifetimeSpend };
    })
  );

  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) return res.status(404).json({ error: 'Not found' });

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const lifetimeSpend = await computeLifetimeSpend(customer.id);
  const itemCounts: Record<string, { name: string; count: number }> = {};
  for (const o of orders) {
    for (const item of o.items) {
      const id = item.productId;
      if (!itemCounts[id]) itemCounts[id] = { name: item.product.name, count: 0 };
      itemCounts[id].count += item.qty;
    }
  }
  const favourites = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  res.json({
    ...customer,
    lifetimeSpend,
    orderCount: orders.length,
    orders: orders.map((o) => ({
      id: o.id,
      displayId: formatOrderId(o.orderNumber),
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
    favourites,
  });
});

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string(),
    phone: z.string(),
    location: z.string().optional(),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const customer = await prisma.customer.create({ data });
  res.status(201).json(customer);
});

router.patch('/:id', async (req, res) => {
  const schema = z.object({ notes: z.string().optional(), name: z.string().optional() });
  const data = schema.parse(req.body);
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data,
  });
  await refreshCustomerTier(customer.id);
  res.json(customer);
});

export default router;
