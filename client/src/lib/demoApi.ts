import type { Order, OrderStatus } from '../types';
import {
  demoCustomers,
  demoMaterials,
  demoProducts,
  demoStaff,
  demoUser,
  initialDemoNotifications,
  initialDemoOrders,
} from './demoData';

const PROGRESS = ['RECEIVED', 'BAKING', 'PACKAGING', 'READY', 'PICKED_UP'] as const;
const FILTER_MAP: Record<string, OrderStatus[] | undefined> = {
  pending: ['PENDING'],
  active: ['IN_PROGRESS', 'READY'],
  completed: ['DELIVERED', 'CANCELLED'],
};

let orders = structuredClone(initialDemoOrders);
let notifications = structuredClone(initialDemoNotifications);
let nextOrderNum = 1044;

function cloneOrder(order: Order): Order {
  return structuredClone(order);
}

function findOrder(id: string) {
  return orders.find((o) => o.id === id);
}

function filterOrders(status?: string, q?: string) {
  const statuses = status ? FILTER_MAP[status.toLowerCase()] : undefined;
  return orders.filter((o) => {
    if (statuses && !statuses.includes(o.status)) return false;
    if (q) {
      const needle = q.toLowerCase();
      return (
        o.displayId.toLowerCase().includes(needle) ||
        o.customer.name.toLowerCase().includes(needle)
      );
    }
    return true;
  });
}

function orderStats() {
  return {
    todayOrders: orders.filter((o) => o.status !== 'CANCELLED').length,
    todayRevenue: orders
      .filter((o) => ['DELIVERED', 'READY', 'IN_PROGRESS'].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0),
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'DELIVERED').length,
    readyForPickup: orders.filter((o) => o.status === 'READY').length,
  };
}

function ordersMeta() {
  return {
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
  };
}

function nextStep(current: string) {
  const idx = PROGRESS.indexOf(current as (typeof PROGRESS)[number]);
  return idx >= 0 && idx < PROGRESS.length - 1 ? PROGRESS[idx + 1] : null;
}

function statusForStep(step: string): OrderStatus {
  if (step === 'PICKED_UP') return 'DELIVERED';
  if (step === 'READY') return 'READY';
  return 'IN_PROGRESS';
}

export async function handleDemoRequest(
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: unknown
): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 120));

  if (method === 'post' && path === 'auth/login') {
    const { email } = body as { email: string; password: string };
    if (email === demoUser.email) {
      return { token: 'demo-token', user: demoUser };
    }
    throw { response: { status: 401, data: { error: 'Invalid credentials' } } };
  }

  if (method === 'get' && path === 'auth/me') {
    return demoUser;
  }

  if (method === 'get' && path === 'orders') {
    const list = filterOrders(params?.status as string | undefined, params?.q as string | undefined);
    return { orders: list.map(cloneOrder), meta: ordersMeta() };
  }

  if (method === 'get' && path === 'orders/stats') {
    return orderStats();
  }

  if (method === 'get' && path === 'employees/stats') {
    return {
      totalStaff: demoStaff.length,
      onShift: demoStaff.filter((s) => s.status === 'ON_SHIFT').length,
      avgRating: 4.7,
      openSlots: 2,
    };
  }

  if (method === 'get' && path === 'employees') {
    let list = [...demoStaff];
    const q = params?.q as string | undefined;
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
    if (params?.onShift) {
      return list
        .filter((s) => s.status === 'ON_SHIFT')
        .map((s) => ({ id: s.id, name: s.name }));
    }
    return list;
  }

  if (method === 'get' && path === 'customers/stats') {
    return {
      total: demoCustomers.length,
      returning: 60,
      avgOrder: 1280,
      vips: demoCustomers.filter((c) => c.tier === 'VIP').length,
    };
  }

  if (method === 'get' && path === 'customers') {
    const tier = params?.tier as string | undefined;
    const list = tier ? demoCustomers.filter((c) => c.tier === tier) : demoCustomers;
    return list;
  }

  if (method === 'get' && path === 'inventory/stats') {
    return {
      totalSkus: demoProducts.length,
      lowStock: demoProducts.filter((p) => p.lowStock).length,
      stockValue: 48200,
      topSeller: { name: 'Classic Sourdough', sold: 42 },
    };
  }

  if (method === 'get' && path === 'inventory/products') {
    return demoProducts;
  }

  if (method === 'get' && path === 'inventory/materials') {
    return demoMaterials;
  }

  if (method === 'get' && path === 'analytics') {
    return {
      monthlyRevenue: 184500,
      ordersThisMonth: 142,
      fulfillmentRate: 94,
      avgRating: 4.8,
      revenueByCategory: [
        { name: 'Bread', revenue: 62000 },
        { name: 'Pastry', revenue: 28000 },
        { name: 'Custom Cakes', revenue: 54000 },
        { name: 'Muffins', revenue: 18500 },
      ],
      staffPerformance: demoStaff.slice(0, 4).map((s) => ({
        name: s.name,
        ordersHandled: 12 + s.experienceYears * 3,
        avgFulfillmentMins: 28,
        rating: s.rating,
      })),
    };
  }

  if (method === 'get' && path === 'notifications') {
    return notifications;
  }

  if (method === 'post' && path === 'notifications/read-all') {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    return { ok: true };
  }

  const notifRead = path.match(/^notifications\/([^/]+)\/read$/);
  if (method === 'patch' && notifRead) {
    notifications = notifications.map((n) =>
      n.id === notifRead[1] ? { ...n, read: true } : n
    );
    return { ok: true };
  }

  const orderSeen = path.match(/^orders\/([^/]+)\/seen$/);
  if (method === 'patch' && orderSeen) {
    const order = findOrder(orderSeen[1]);
    if (!order) throw { response: { status: 404 } };
    order.isNew = false;
    return cloneOrder(order);
  }

  const orderAccept = path.match(/^orders\/([^/]+)\/accept$/);
  if (method === 'post' && orderAccept) {
    const order = findOrder(orderAccept[1]);
    if (!order) throw { response: { status: 404 } };
    order.status = 'IN_PROGRESS';
    order.isNew = false;
    order.progressStep = 'RECEIVED';
    return cloneOrder(order);
  }

  const orderDecline = path.match(/^orders\/([^/]+)\/decline$/);
  if (method === 'post' && orderDecline) {
    const order = findOrder(orderDecline[1]);
    if (!order) throw { response: { status: 404 } };
    order.status = 'CANCELLED';
    order.isNew = false;
    return cloneOrder(order);
  }

  const orderProgress = path.match(/^orders\/([^/]+)\/progress$/);
  if (method === 'patch' && orderProgress) {
    const order = findOrder(orderProgress[1]);
    if (!order) throw { response: { status: 404 } };
    const step = nextStep(order.progressStep);
    if (step) {
      order.progressStep = step;
      order.status = statusForStep(step);
    }
    return cloneOrder(order);
  }

  const orderAssign = path.match(/^orders\/([^/]+)\/assign$/);
  if (method === 'patch' && orderAssign) {
    const order = findOrder(orderAssign[1]);
    if (!order) throw { response: { status: 404 } };
    const { assignedToId } = body as { assignedToId: string | null };
    order.assignedToId = assignedToId;
    const staff = demoStaff.find((s) => s.id === assignedToId);
    order.assignedTo = staff ? { id: staff.id, name: staff.name } : null;
    return cloneOrder(order);
  }

  if (method === 'post' && path === 'orders') {
    const payload = body as {
      customerId: string;
      items: { productId: string; qty: number }[];
      notes?: string;
    };
    const customer = demoCustomers.find((c) => c.id === payload.customerId)!;
    const orderItems = payload.items.map((item, i) => {
      const product = demoProducts.find((p) => p.id === item.productId)!;
      return {
        id: `new-item-${i}`,
        qty: item.qty,
        unitPrice: product.price,
        product: { id: product.id, name: product.name, category: product.category },
      };
    });
    const total = orderItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    const num = nextOrderNum++;
    const newOrder: Order = {
      id: `ord-${num}`,
      orderNumber: num,
      displayId: `#HWD-${num}`,
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        location: customer.location,
        tier: customer.tier,
      },
      assignedToId: null,
      assignedTo: null,
      status: 'PENDING',
      type: 'PICKUP',
      progressStep: 'RECEIVED',
      requestedAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      notes: payload.notes ?? null,
      total,
      isNew: true,
      source: 'crm',
      createdAt: new Date().toISOString(),
      itemsSummary: orderItems.map((i) => `${i.product.name} ×${i.qty}`).join(', '),
      customerType: customer.orderCount <= 1 ? 'new' : 'returning',
      items: orderItems,
    };
    orders = [newOrder, ...orders];
    return cloneOrder(newOrder);
  }

  throw { response: { status: 404, data: { error: `Demo route not found: ${method} ${path}` } } };
}
