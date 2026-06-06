import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.staffNotification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customerReview.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      name: 'Ravi Sharma',
      email: 'ravi@helloweirdough.in',
      passwordHash,
      role: 'OWNER',
      phone: '+919876543210',
      rating: 5,
    },
  });

  const staffData = [
    { name: 'Asha Menon', email: 'asha@helloweirdough.in', employeeRole: 'HEAD_BAKER' as const, shift: 'MORNING' as const, status: 'ON_SHIFT' as const, rating: 4.9, experienceYears: 6 },
    { name: 'Rohan Kumar', email: 'rohan@helloweirdough.in', employeeRole: 'CAKE_DECORATOR' as const, shift: 'MORNING' as const, status: 'ON_SHIFT' as const, rating: 4.7, experienceYears: 3 },
    { name: 'Nisha Patel', email: 'nisha@helloweirdough.in', employeeRole: 'COUNTER_STAFF' as const, shift: 'MORNING' as const, status: 'ON_LEAVE' as const, rating: 4.5, experienceYears: 1 },
    { name: 'Dev Pillai', email: 'dev@helloweirdough.in', employeeRole: 'BAKER' as const, shift: 'EVENING' as const, status: 'EVENING' as const, rating: 4.8, experienceYears: 4 },
    { name: 'Simran Batra', email: 'simran@helloweirdough.in', employeeRole: 'DELIVERY' as const, shift: 'MORNING' as const, status: 'ON_SHIFT' as const, rating: 4.6, experienceYears: 2 },
    { name: 'Vijay Thomas', email: 'vijay@helloweirdough.in', employeeRole: 'PACKAGING' as const, shift: 'MORNING' as const, status: 'ON_SHIFT' as const, rating: 4.4, experienceYears: 1.5 },
  ];

  const staff = await Promise.all(
    staffData.map((s) =>
      prisma.user.create({
        data: { ...s, passwordHash, role: 'STAFF', phone: '+919000000001' },
      })
    )
  );

  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Classic Sourdough', category: 'BREAD', stock: 28, unit: 'loaves', threshold: 10, price: 320 } }),
    prisma.product.create({ data: { name: 'Butter Croissant', category: 'PASTRY', stock: 5, unit: 'units', threshold: 12, price: 50 } }),
    prisma.product.create({ data: { name: 'Multigrain Loaf', category: 'BREAD', stock: 14, unit: 'loaves', threshold: 8, price: 250 } }),
    prisma.product.create({ data: { name: 'Custom Cakes', category: 'CUSTOM_CAKES', stock: 3, unit: 'pending', threshold: 2, price: 2200 } }),
    prisma.product.create({ data: { name: 'Blueberry Muffin', category: 'MUFFINS', stock: 6, unit: 'units', threshold: 15, price: 80 } }),
    prisma.product.create({ data: { name: 'Focaccia', category: 'BREAD', stock: 11, unit: 'pieces', threshold: 6, price: 180 } }),
  ]);

  await Promise.all([
    prisma.rawMaterial.create({ data: { name: 'All-purpose flour', stock: 48, unit: 'kg', minRequired: 30 } }),
    prisma.rawMaterial.create({ data: { name: 'Unsalted butter', stock: 6, unit: 'kg', minRequired: 10 } }),
    prisma.rawMaterial.create({ data: { name: 'Active dry yeast', stock: 1.2, unit: 'kg', minRequired: 2 } }),
    prisma.rawMaterial.create({ data: { name: 'Eggs', stock: 140, unit: 'pcs', minRequired: 60 } }),
    prisma.rawMaterial.create({ data: { name: 'Sourdough starter', stock: 0.8, unit: 'kg', minRequired: 1 } }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Priya Mehta', phone: '+919811122233', location: 'Faridabad', tier: 'VIP' } }),
    prisma.customer.create({ data: { name: 'Aryan Kapoor', phone: '+919822233344', location: 'Delhi', tier: 'ACTIVE' } }),
    prisma.customer.create({ data: { name: 'Meera Nair', phone: '+919833344455', location: 'Faridabad', tier: 'VIP' } }),
    prisma.customer.create({ data: { name: 'Sneha Joshi', phone: '+919844455566', location: 'Gurgaon', tier: 'NEW' } }),
    prisma.customer.create({ data: { name: 'Karan Malhotra', phone: '+919810345678', location: 'Faridabad', tier: 'NEW' } }),
  ]);

  const [priya, aryan, meera, sneha, karan] = customers;
  const [sourdough, croissant, multigrain, customCake, muffin, focaccia] = products;
  const asha = staff[0];

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
  const readyAt = (h: number) => new Date(now.getTime() + h * 3600000);

  const orderDefs = [
    { num: 1038, customer: meera, status: 'CANCELLED' as const, step: 'RECEIVED' as const, total: 1120, isNew: false, h: 5, items: [{ p: muffin, q: 6 }, { p: sourdough, q: 1 }] },
    { num: 1039, customer: aryan, status: 'DELIVERED' as const, step: 'PICKED_UP' as const, total: 640, isNew: false, h: 4, items: [{ p: focaccia, q: 2 }, { p: croissant, q: 4 }] },
    { num: 1040, customer: sneha, status: 'PENDING' as const, step: 'RECEIVED' as const, total: 750, isNew: false, h: 3.5, items: [{ p: multigrain, q: 3 }] },
    { num: 1041, customer: aryan, status: 'IN_PROGRESS' as const, step: 'BAKING' as const, total: 2400, isNew: false, h: 3, assign: asha, items: [{ p: customCake, q: 1 }] },
    { num: 1042, customer: priya, status: 'READY' as const, step: 'READY' as const, total: 980, isNew: false, h: 2, assign: asha, items: [{ p: sourdough, q: 2 }, { p: croissant, q: 4 }] },
    { num: 1043, customer: karan, status: 'PENDING' as const, step: 'RECEIVED' as const, total: 2940, isNew: true, h: 0.1, source: 'helloweirdough.in', notes: '"Happy Birthday Ria!" on cake', items: [{ p: customCake, q: 1 }, { p: sourdough, q: 2 }, { p: croissant, q: 2 }] },
  ];

  for (const o of orderDefs) {
    await prisma.order.create({
      data: {
        orderNumber: o.num,
        customerId: o.customer.id,
        assignedToId: o.assign?.id,
        status: o.status,
        progressStep: o.step,
        type: 'PICKUP',
        requestedAt: readyAt(2),
        notes: o.notes,
        total: o.total,
        isNew: o.isNew,
        source: o.source ?? 'crm',
        createdAt: hoursAgo(o.h),
        items: {
          create: o.items.map((i) => ({
            productId: i.p.id,
            qty: i.q,
            unitPrice: i.p.price,
          })),
        },
      },
    });
  }

  for (const s of staff) {
    await prisma.customerReview.create({
      data: { userId: s.id, rating: 5, comment: 'Great team player!' },
    });
  }

  console.log('Seed complete:', { owner: owner.email, staff: staff.length });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
