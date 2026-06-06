import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  formatOrderId,
  itemsSummary,
  nextProgressStep,
  statusesForFilter,
} from '../lib/orderHelpers.js';
import { startOfTodayIST, endOfTodayIST } from '../lib/dayjs.js';
import { refreshCustomerTier } from '../lib/customerTier.js';
import {
  emitOrderNew,
  emitOrderUpdated,
  emitNotification,
} from '../socket.js';
import {
  sendOrderConfirmedWhatsApp,
  sendOrderReadyWhatsApp,
  sendCancellationSms,
} from '../services/notificationService.js';

const router = Router();
router.use(requireAuth);

const orderInclude = {
  customer: true,
  assignedTo: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

async function serializeOrder(order: Awaited<ReturnType<typeof fetchOrder>>) {
  if (!order) return null;
  const orderCount = await prisma.order.count({
    where: { customerId: order.customerId, status: { not: 'CANCELLED' } },
  });
  return {
    ...order,
    displayId: formatOrderId(order.orderNumber),
    itemsSummary: itemsSummary(order.items),
    customerType: orderCount <= 1 ? 'new' : 'returning',
  };
}

async function fetchOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
}

router.get('/stats', async (_req, res) => {
  const start = startOfTodayIST().toDate();
  const end = endOfTodayIST().toDate();
  const today = { createdAt: { gte: start, lte: end } };

  const [todayCount, revenueAgg, inProgress, completed, ready] = await Promise.all([
    prisma.order.count({ where: { ...today, status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({
      where: { ...today, status: { in: ['DELIVERED', 'READY', 'IN_PROGRESS'] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.order.count({ where: { status: 'DELIVERED', ...today } }),
    prisma.order.count({ where: { status: 'READY' } }),
  ]);

  res.json({
    todayOrders: todayCount,
    todayRevenue: revenueAgg._sum.total ?? 0,
    inProgress,
    completed,
    readyForPickup: ready,
    sublabels: {
      todayOrders: 'Today in IST',
      todayRevenue: 'Today in IST',
      inProgress: `${ready} ready for pickup`,
      completed: 'Delivered today',
    },
  });
});

router.get('/', async (req, res) => {
  const q = (req.query.q as string)?.trim();
  const filter = req.query.status as string | undefined;
  const statuses = statusesForFilter(filter);
  const orderNumMatch = q?.match(/HWD-?(\d+)/i);

  const orders = await prisma.order.findMany({
    where: {
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(q
        ? {
            OR: [
              { customer: { name: { contains: q, mode: 'insensitive' } } },
              ...(orderNumMatch
                ? [{ orderNumber: parseInt(orderNumMatch[1], 10) }]
                : []),
            ],
          }
        : {}),
    },
    include: orderInclude,
    orderBy: [{ isNew: 'desc' }, { createdAt: 'desc' }],
  });

  const serialized = await Promise.all(orders.map(serializeOrder));
  const pending = orders.filter((o) => o.status === 'PENDING').length;
  const active = orders.filter((o) => o.status === 'IN_PROGRESS').length;

  res.json({ orders: serialized, meta: { pending, inProgress: active } });
});

router.get('/:id', async (req, res) => {
  const order = await serializeOrder(await fetchOrder(req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

const createSchema = z.object({
  customerId: z.string(),
  assignedToId: z.string().optional(),
  type: z.enum(['PICKUP', 'DELIVERY']),
  requestedAt: z.string().datetime(),
  notes: z.string().optional(),
  items: z.array(
    z.object({ productId: z.string(), qty: z.number().int().positive() })
  ).min(1),
  source: z.string().optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.productId) } },
  });
  const total = parsed.data.items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId);
    return sum + (p?.price ?? 0) * item.qty;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerId: parsed.data.customerId,
      assignedToId: parsed.data.assignedToId,
      type: parsed.data.type,
      requestedAt: new Date(parsed.data.requestedAt),
      notes: parsed.data.notes,
      total,
      isNew: true,
      source: parsed.data.source ?? 'crm',
      items: {
        create: parsed.data.items.map((item) => {
          const p = products.find((x) => x.id === item.productId)!;
          return { productId: item.productId, qty: item.qty, unitPrice: p.price };
        }),
      },
    },
    include: orderInclude,
  });

  await refreshCustomerTier(order.customerId);
  const serialized = await serializeOrder(order);
  emitOrderNew(serialized);

  if (order.assignedToId) {
    const notif = await prisma.staffNotification.create({
      data: {
        userId: order.assignedToId,
        orderId: order.id,
        title: `New order — ${formatOrderId(order.orderNumber)}`,
        body: `${order.customer.name} · ${itemsSummary(order.items)} · ${order.type} ${order.requestedAt.toISOString()}`,
      },
    });
    emitNotification(order.assignedToId, notif);
  }

  res.status(201).json(serialized);
});

router.post('/:id/accept', async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'IN_PROGRESS', isNew: false, progressStep: 'RECEIVED' },
    include: orderInclude,
  });
  await sendOrderConfirmedWhatsApp(order);
  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

router.post('/:id/decline', async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', isNew: false },
    include: orderInclude,
  });
  if (req.body?.notify !== false) await sendCancellationSms(order);
  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

router.patch('/:id/assign', async (req, res) => {
  const { assignedToId } = z.object({ assignedToId: z.string().nullable() }).parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { assignedToId },
    include: orderInclude,
  });
  if (assignedToId) {
    const notif = await prisma.staffNotification.create({
      data: {
        userId: assignedToId,
        orderId: order.id,
        title: `New order — ${formatOrderId(order.orderNumber)}`,
        body: `${order.customer.name} · ${itemsSummary(order.items)}`,
      },
    });
    emitNotification(assignedToId, notif);
  }
  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

router.patch('/:id/progress', async (req, res) => {
  const existing = await fetchOrder(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const next = nextProgressStep(existing.progressStep);
  if (!next) return res.status(400).json({ error: 'Already at final step' });

  let status = existing.status;
  if (next === 'READY') status = 'READY';
  if (next === 'PICKED_UP') status = 'DELIVERED';

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { progressStep: next, status, isNew: false },
    include: orderInclude,
  });

  if (next === 'READY') await sendOrderReadyWhatsApp(order);
  if (next === 'PICKED_UP') await refreshCustomerTier(order.customerId);

  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

router.patch('/:id/seen', async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { isNew: false },
    include: orderInclude,
  });
  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = z
    .object({ status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']) })
    .parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, isNew: false },
    include: orderInclude,
  });
  const serialized = await serializeOrder(order);
  emitOrderUpdated(serialized);
  res.json(serialized);
});

export default router;
