export type UserRole = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeRole?: string;
  status?: string;
  phone?: string;
  shift?: string;
  rating?: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  displayId: string;
  customerId: string;
  customer: { id: string; name: string; phone: string; location?: string | null; tier: string };
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  status: OrderStatus;
  type: 'PICKUP' | 'DELIVERY';
  progressStep: string;
  requestedAt: string;
  notes?: string | null;
  total: number;
  isNew: boolean;
  source: string;
  createdAt: string;
  itemsSummary: string;
  customerType: 'new' | 'returning';
  items: {
    id: string;
    qty: number;
    unitPrice: number;
    product: { id: string; name: string; category: string };
  }[];
}

export interface StaffNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  orderId?: string | null;
  createdAt: string;
  order?: Order;
}
