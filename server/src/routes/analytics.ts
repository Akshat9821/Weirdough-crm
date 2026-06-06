import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { nowIST } from '../lib/dayjs.js';

const router = Router();
router.use(requireAuth, requireOwner);

const CATEGORY_LABELS: Record<string, string> = {
  BREAD: 'Breads',
  CUSTOM_CAKES: 'Custom cakes',
  PASTRY: 'Pastries',
  MUFFINS: 'Muffins & cookies',
  BEVERAGES: 'Beverages',
  SPECIALTY: 'Specialty',
};

router.get('/', async (_req, res) => {
  const monthStart = nowIST().startOf('month').toDate();

  const ordersThisMonth = await prisma.order.findMany({
    where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
    include: { items: { include: { product: true } } },
  });

  const monthlyRevenue = ordersThisMonth.reduce((s, o) => s + o.total, 0);
  const delivered = ordersThisMonth.filter((o) => o.status === 'DELIVERED').length;
  const fulfillmentRate =
    ordersThisMonth.length > 0
      ? Math.round((delivered / ordersThisMonth.length) * 100)
      : 0;

  const categoryRevenue: Record<string, number> = {};
  for (const o of ordersThisMonth) {
    for (const item of o.items) {
      const cat = item.product.category;
      const label = CATEGORY_LABELS[cat] ?? cat;
      categoryRevenue[label] = (categoryRevenue[label] ?? 0) + item.unitPrice * item.qty;
    }
  }
  const revenueByCategory = Object.entries(categoryRevenue).map(([name, revenue]) => ({
    name,
    revenue,
  }));

  const staff = await prisma.user.findMany({ where: { role: 'STAFF' } });
  const staffPerformance = await Promise.all(
    staff.map(async (s) => {
      const handled = await prisma.order.count({
        where: { assignedToId: s.id, createdAt: { gte: monthStart } },
      });
      return {
        id: s.id,
        name: s.name,
        ordersHandled: handled,
        avgFulfillmentMins: 45,
        rating: s.rating,
      };
    })
  );

  const avgRating =
    staff.length > 0
      ? staff.reduce((sum, s) => sum + s.rating, 0) / staff.length
      : 0;

  res.json({
    monthlyRevenue,
    ordersThisMonth: ordersThisMonth.length,
    fulfillmentRate,
    avgRating: Math.round(avgRating * 10) / 10,
    revenueByCategory,
    staffPerformance,
  });
});

export default router;
