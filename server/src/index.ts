import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import employeesRoutes from './routes/employees.js';
import inventoryRoutes from './routes/inventory.js';
import customersRoutes from './routes/customers.js';
import analyticsRoutes from './routes/analytics.js';
import notificationsRoutes from './routes/notifications.js';
import { initSocket, getIO, joinUserRoom } from './socket.js';
import { verifyToken } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true })
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

getIO().on('connection', (socket) => {
  try {
    const user = verifyToken(socket.handshake.auth.token as string);
    socket.join(`user:${user.userId}`);
    joinUserRoom(socket.id, user.userId);
  } catch {
    socket.disconnect();
  }
});

const port = Number(process.env.PORT) || 4000;
httpServer.listen(port, () => {
  console.log(`HelloWeirdough API http://localhost:${port}`);
});
