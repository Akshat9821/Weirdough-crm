import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './middleware/auth.js';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Auth required'));
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', () => {});
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitOrderNew(order: unknown) {
  getIO().emit('order:new', order);
}

export function emitOrderUpdated(order: unknown) {
  getIO().emit('order:updated', order);
}

export function emitNotification(userId: string, notification: unknown) {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
}

export function joinUserRoom(socketId: string, userId: string) {
  const socket = getIO().sockets.sockets.get(socketId);
  socket?.join(`user:${userId}`);
}
