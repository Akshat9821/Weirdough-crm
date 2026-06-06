import twilio from 'twilio';
import { formatOrderId, itemsSummary } from '../lib/orderHelpers.js';
import { formatIST } from '../lib/dayjs.js';

type OrderWithRelations = {
  orderNumber: number;
  total: number;
  requestedAt: Date;
  items: { qty: number; product: { name: string } }[];
  customer: { name: string; phone: string };
};

function twilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function logDev(channel: string, to: string, body: string) {
  console.log(`[${channel}] → ${to}\n${body}\n`);
}

export async function sendOrderConfirmedWhatsApp(order: OrderWithRelations) {
  const id = formatOrderId(order.orderNumber);
  const items = itemsSummary(order.items);
  const ready = formatIST(order.requestedAt);
  const body = `Hi ${order.customer.name}! Order ${id} confirmed.\n${items}\nTotal: ₹${order.total.toLocaleString('en-IN')} · Ready by ${ready}.`;
  const to = `whatsapp:${order.customer.phone.replace(/\s/g, '')}`;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const client = twilioClient();
  if (!client || !from) {
    logDev('WhatsApp', to, body);
    return { ok: true, channel: 'log' as const };
  }
  try {
    await client.messages.create({ from, to, body });
    return { ok: true, channel: 'whatsapp' as const };
  } catch (err) {
    console.error('WhatsApp failed', err);
    await sendSmsFallback(order.customer.phone, body);
    return { ok: true, channel: 'sms' as const };
  }
}

export async function sendOrderReadyWhatsApp(order: OrderWithRelations) {
  const id = formatOrderId(order.orderNumber);
  const body = `Your ${id} is ready! Come pick up anytime.`;
  const to = `whatsapp:${order.customer.phone.replace(/\s/g, '')}`;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const client = twilioClient();
  if (!client || !from) {
    logDev('WhatsApp', to, body);
    return;
  }
  try {
    await client.messages.create({ from, to, body });
  } catch (err) {
    console.error('WhatsApp ready failed', err);
    await sendSmsFallback(order.customer.phone, body);
  }
}

export async function sendSmsFallback(phone: string, longBody: string) {
  const compact = longBody.replace(/\n/g, ' ').slice(0, 300);
  const from = process.env.TWILIO_SMS_FROM;
  const client = twilioClient();
  const to = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
  if (!client || !from) {
    logDev('SMS', to, compact);
    return;
  }
  try {
    await client.messages.create({ from, to, body: compact });
  } catch (err) {
    console.error('SMS failed', err);
    logDev('SMS', to, compact);
  }
}

export async function sendCancellationSms(order: OrderWithRelations) {
  const id = formatOrderId(order.orderNumber);
  const body = `HelloWeirdough: Order ${id} has been cancelled. Call us if you have questions.`;
  await sendSmsFallback(order.customer.phone, body);
}
