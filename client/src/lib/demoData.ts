import type { Order, StaffNotification, User } from '../types';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const readyAt = (h: number) => new Date(now + h * 3600000).toISOString();

export const demoUser: User = {
  id: 'demo-owner',
  name: 'Ravi Sharma',
  email: 'ravi@helloweirdough.in',
  role: 'OWNER',
  phone: '+919876543210',
  rating: 5,
};

export const demoStaff = [
  { id: 'staff-1', name: 'Asha Menon', employeeRole: 'HEAD_BAKER', shift: 'MORNING', status: 'ON_SHIFT', rating: 4.9, experienceYears: 6 },
  { id: 'staff-2', name: 'Rohan Kumar', employeeRole: 'CAKE_DECORATOR', shift: 'MORNING', status: 'ON_SHIFT', rating: 4.7, experienceYears: 3 },
  { id: 'staff-3', name: 'Nisha Patel', employeeRole: 'COUNTER_STAFF', shift: 'MORNING', status: 'ON_LEAVE', rating: 4.5, experienceYears: 1 },
  { id: 'staff-4', name: 'Dev Pillai', employeeRole: 'BAKER', shift: 'EVENING', status: 'EVENING', rating: 4.8, experienceYears: 4 },
  { id: 'staff-5', name: 'Simran Batra', employeeRole: 'DELIVERY', shift: 'MORNING', status: 'ON_SHIFT', rating: 4.6, experienceYears: 2 },
  { id: 'staff-6', name: 'Vijay Thomas', employeeRole: 'PACKAGING', shift: 'MORNING', status: 'ON_SHIFT', rating: 4.4, experienceYears: 1.5 },
];

export const demoCustomers = [
  { id: 'cust-1', name: 'Priya Mehta', phone: '+919811122233', location: 'Faridabad', tier: 'VIP', orderCount: 12, lifetimeSpend: 18400 },
  { id: 'cust-2', name: 'Aryan Kapoor', phone: '+919822233344', location: 'Delhi', tier: 'ACTIVE', orderCount: 5, lifetimeSpend: 6200 },
  { id: 'cust-3', name: 'Meera Nair', phone: '+919833344455', location: 'Faridabad', tier: 'VIP', orderCount: 8, lifetimeSpend: 11200 },
  { id: 'cust-4', name: 'Sneha Joshi', phone: '+919844455566', location: 'Gurgaon', tier: 'NEW', orderCount: 1, lifetimeSpend: 750 },
  { id: 'cust-5', name: 'Karan Malhotra', phone: '+919810345678', location: 'Faridabad', tier: 'NEW', orderCount: 1, lifetimeSpend: 2940 },
];

export const demoProducts = [
  { id: 'prod-1', name: 'Classic Sourdough', category: 'BREAD', stock: 28, unit: 'loaves', threshold: 10, price: 320, lowStock: false },
  { id: 'prod-2', name: 'Butter Croissant', category: 'PASTRY', stock: 5, unit: 'units', threshold: 12, price: 50, lowStock: true },
  { id: 'prod-3', name: 'Multigrain Loaf', category: 'BREAD', stock: 14, unit: 'loaves', threshold: 8, price: 250, lowStock: false },
  { id: 'prod-4', name: 'Custom Cakes', category: 'CUSTOM_CAKES', stock: 3, unit: 'pending', threshold: 2, price: 2200, lowStock: false },
  { id: 'prod-5', name: 'Blueberry Muffin', category: 'MUFFINS', stock: 6, unit: 'units', threshold: 15, price: 80, lowStock: true },
  { id: 'prod-6', name: 'Focaccia', category: 'BREAD', stock: 11, unit: 'pieces', threshold: 6, price: 180, lowStock: false },
];

export const demoMaterials = [
  { id: 'mat-1', name: 'All-purpose flour', stock: 48, unit: 'kg', minRequired: 30, status: 'OK' },
  { id: 'mat-2', name: 'Unsalted butter', stock: 6, unit: 'kg', minRequired: 10, status: 'BORDERLINE' },
  { id: 'mat-3', name: 'Active dry yeast', stock: 1.2, unit: 'kg', minRequired: 2, status: 'LOW' },
  { id: 'mat-4', name: 'Eggs', stock: 140, unit: 'pcs', minRequired: 60, status: 'OK' },
  { id: 'mat-5', name: 'Sourdough starter', stock: 0.8, unit: 'kg', minRequired: 1, status: 'LOW' },
];

function makeOrder(
  id: string,
  num: number,
  customerId: string,
  status: Order['status'],
  step: string,
  total: number,
  isNew: boolean,
  createdAt: string,
  items: { productId: string; qty: number }[],
  extra?: Partial<Order>
): Order {
  const customer = demoCustomers.find((c) => c.id === customerId)!;
  const orderItems = items.map((item, i) => {
    const product = demoProducts.find((p) => p.id === item.productId)!;
    return {
      id: `${id}-item-${i}`,
      qty: item.qty,
      unitPrice: product.price,
      product: { id: product.id, name: product.name, category: product.category },
    };
  });
  const itemsSummary = orderItems.map((i) => `${i.product.name} ×${i.qty}`).join(', ');
  return {
    id,
    orderNumber: num,
    displayId: `#HWD-${num}`,
    customerId,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      location: customer.location,
      tier: customer.tier,
    },
    assignedToId: extra?.assignedToId ?? null,
    assignedTo: extra?.assignedTo ?? null,
    status,
    type: 'PICKUP',
    progressStep: step,
    requestedAt: readyAt(2),
    notes: extra?.notes ?? null,
    total,
    isNew,
    source: extra?.source ?? 'crm',
    createdAt,
    itemsSummary,
    customerType: customer.orderCount <= 1 ? 'new' : 'returning',
    items: orderItems,
  };
}

export const initialDemoOrders: Order[] = [
  makeOrder('ord-1', 1038, 'cust-3', 'CANCELLED', 'RECEIVED', 1120, false, hoursAgo(5), [
    { productId: 'prod-5', qty: 6 },
    { productId: 'prod-1', qty: 1 },
  ]),
  makeOrder('ord-2', 1039, 'cust-2', 'DELIVERED', 'PICKED_UP', 640, false, hoursAgo(4), [
    { productId: 'prod-6', qty: 2 },
    { productId: 'prod-2', qty: 4 },
  ]),
  makeOrder('ord-3', 1040, 'cust-4', 'PENDING', 'RECEIVED', 750, false, hoursAgo(3.5), [
    { productId: 'prod-3', qty: 3 },
  ]),
  makeOrder('ord-4', 1041, 'cust-2', 'IN_PROGRESS', 'BAKING', 2400, false, hoursAgo(3), [
    { productId: 'prod-4', qty: 1 },
  ], { assignedToId: 'staff-1', assignedTo: { id: 'staff-1', name: 'Asha Menon' } }),
  makeOrder('ord-5', 1042, 'cust-1', 'READY', 'READY', 980, false, hoursAgo(2), [
    { productId: 'prod-1', qty: 2 },
    { productId: 'prod-2', qty: 4 },
  ], { assignedToId: 'staff-1', assignedTo: { id: 'staff-1', name: 'Asha Menon' } }),
  makeOrder('ord-6', 1043, 'cust-5', 'PENDING', 'RECEIVED', 2940, true, hoursAgo(0.1), [
    { productId: 'prod-4', qty: 1 },
    { productId: 'prod-1', qty: 2 },
    { productId: 'prod-2', qty: 2 },
  ], { source: 'helloweirdough.in', notes: '"Happy Birthday Ria!" on cake' }),
];

export const initialDemoNotifications: StaffNotification[] = [
  {
    id: 'notif-1',
    title: 'New order #HWD-1043',
    body: 'Karan Malhotra placed an order via helloweirdough.in',
    read: false,
    orderId: 'ord-6',
    createdAt: hoursAgo(0.1),
  },
  {
    id: 'notif-2',
    title: 'Low stock alert',
    body: 'Butter Croissant is below threshold',
    read: false,
    orderId: null,
    createdAt: hoursAgo(1),
  },
  {
    id: 'notif-3',
    title: 'Order ready',
    body: '#HWD-1042 is ready for pickup',
    read: true,
    orderId: 'ord-5',
    createdAt: hoursAgo(2),
  },
];
