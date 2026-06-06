import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { formatOrderId } from '../lib/orderHelpers.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', async (_req, res) => {
  const [total, onShift, avgRating] = await Promise.all([
    prisma.user.count({ where: { role: 'STAFF' } }),
    prisma.user.count({ where: { role: 'STAFF', status: 'ON_SHIFT' } }),
    prisma.user.aggregate({ where: { role: 'STAFF' }, _avg: { rating: true } }),
  ]);
  res.json({
    totalStaff: total,
    onShift,
    avgRating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
    openSlots: 3,
  });
});

router.get('/', async (req, res) => {
  const onShiftOnly = req.query.onShift === 'true';
  const q = (req.query.q as string)?.trim();

  const users = await prisma.user.findMany({
    where: {
      role: 'STAFF',
      ...(onShiftOnly ? { status: 'ON_SHIFT' } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeRole: true,
      shift: true,
      status: true,
      rating: true,
      experienceYears: true,
      joinDate: true,
    },
  });
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      assignedOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      },
      reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });

  const attendance = await prisma.attendanceLog.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 14,
  });

  res.json({
    ...user,
    passwordHash: undefined,
    orderHistory: user.assignedOrders.map((o) => ({
      id: o.id,
      displayId: formatOrderId(o.orderNumber),
      customer: o.customer.name,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
    schedule: buildWeeklySchedule(user.shift),
    attendance,
  });
});

function buildWeeklySchedule(shift: string | null) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d) => ({
    day: d,
    shift: shift ?? '—',
    active: shift !== null && !['Sat', 'Sun'].includes(d),
  }));
}

const upsertSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  employeeRole: z.enum([
    'HEAD_BAKER',
    'BAKER',
    'CAKE_DECORATOR',
    'COUNTER_STAFF',
    'DELIVERY',
    'PACKAGING',
  ]),
  shift: z.enum(['MORNING', 'EVENING', 'NIGHT']),
  status: z.enum(['ON_SHIFT', 'ON_LEAVE', 'EVENING']),
  experienceYears: z.number().optional(),
  joinDate: z.string().optional(),
});

router.post('/', requireOwner, async (req, res) => {
  const parsed = upsertSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(parsed.password ?? 'password123', 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      passwordHash,
      role: 'STAFF',
      employeeRole: parsed.employeeRole,
      shift: parsed.shift,
      status: parsed.status,
      experienceYears: parsed.experienceYears ?? 1,
      joinDate: parsed.joinDate ? new Date(parsed.joinDate) : new Date(),
    },
  });
  res.status(201).json(user);
});

router.patch('/:id', requireOwner, async (req, res) => {
  const parsed = upsertSchema.partial().parse(req.body);
  const data: Record<string, unknown> = { ...parsed };
  if (parsed.password) data.passwordHash = await bcrypt.hash(parsed.password, 10);
  delete data.password;
  if (parsed.joinDate) data.joinDate = new Date(parsed.joinDate);
  const id = String(req.params.id);
  const user = await prisma.user.update({ where: { id }, data });
  res.json(user);
});

export default router;
