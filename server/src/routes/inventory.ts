import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { startOfTodayIST } from '../lib/dayjs.js';

const router = Router();
router.use(requireAuth);

function materialStatus(stock: number, minRequired: number) {
  if (stock < minRequired * 0.9) return 'LOW';
  if (stock < minRequired * 1.1) return 'BORDERLINE';
  return 'OK';
}

router.get('/stats', async (_req, res) => {
  const products = await prisma.product.findMany();
  const lowCount = products.filter((p) => p.stock < p.threshold).length;
  const stockValue = products.reduce((s, p) => s + p.stock * p.price, 0);

  const weekStart = startOfTodayIST().subtract(7, 'day').toDate();
  const topItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { createdAt: { gte: weekStart }, status: { not: 'CANCELLED' } } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: 1,
  });
  let topSeller = { name: '—', sold: 0 };
  if (topItems[0]) {
    const p = await prisma.product.findUnique({ where: { id: topItems[0].productId } });
    topSeller = { name: p?.name ?? '—', sold: topItems[0]._sum.qty ?? 0 };
  }

  res.json({
    totalSkus: products.length,
    lowStock: lowCount,
    stockValue,
    topSeller,
  });
});

router.get('/products', async (req, res) => {
  const q = (req.query.q as string)?.trim();
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
  });
  res.json(
    products.map((p) => ({
      ...p,
      lowStock: p.stock < p.threshold,
    }))
  );
});

router.post('/products', requireOwner, async (req, res) => {
  const schema = z.object({
    name: z.string(),
    category: z.enum(['BREAD', 'PASTRY', 'SPECIALTY', 'MUFFINS', 'BEVERAGES', 'CUSTOM_CAKES']),
    stock: z.number(),
    unit: z.string(),
    threshold: z.number(),
    price: z.number(),
  });
  const data = schema.parse(req.body);
  const product = await prisma.product.create({ data });
  res.status(201).json(product);
});

router.patch('/products/:id', requireOwner, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: String(req.params.id) },
    data: req.body,
  });
  res.json(product);
});

router.get('/materials', async (_req, res) => {
  const materials = await prisma.rawMaterial.findMany({ orderBy: { name: 'asc' } });
  res.json(
    materials.map((m) => ({
      ...m,
      status: materialStatus(m.stock, m.minRequired),
    }))
  );
});

router.post('/materials', requireOwner, async (req, res) => {
  const schema = z.object({
    name: z.string(),
    stock: z.number(),
    unit: z.string(),
    minRequired: z.number(),
  });
  const data = schema.parse(req.body);
  const material = await prisma.rawMaterial.create({ data });
  res.json(material);
});

export default router;
