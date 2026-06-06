import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const notifications = await prisma.staffNotification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { order: { include: { customer: true } } },
  });
  res.json(notifications);
});

router.patch('/:id/read', async (req, res) => {
  const n = await prisma.staffNotification.update({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { read: true },
  });
  res.json(n);
});

router.post('/read-all', async (req, res) => {
  await prisma.staffNotification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});

export default router;
