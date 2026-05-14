import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket kết nối: ${socket.id}`);

    socket.on('join:event', (eventId: number) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave:event', (eventId: number) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('join:user', (userId: number) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return;
        const payload = jwt.verify(token, env.jwt.accessSecret) as { id: number };
        // Chỉ cho join room của chính mình
        if (payload.id === Number(userId)) {
          socket.join(`user:${userId}`);
        }
      } catch { /* token hết hạn hoặc không hợp lệ — bỏ qua */ }
    });

    socket.on('leave:user', (userId: number) => {
      socket.leave(`user:${userId}`);
    });

    // Admin dashboard room — Fix 3: verify JWT + role trước khi join
    socket.on('join:admin', () => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return;
        const payload = jwt.verify(token, env.jwt.accessSecret) as { id: number; role?: string };
        if (payload.role === 'admin') {
          socket.join('admin:dashboard');
        }
      } catch { /* token không hợp lệ hoặc hết hạn */ }
    });

    socket.on('leave:admin', () => {
      socket.leave('admin:dashboard');
    });

    // Chat room — join với minimal auth (verify conv tồn tại + check JWT nếu có)
    socket.on('chat:join', async (conversationId: number) => {
      try {
        const { ChatConversation } = await import('../models/ChatConversation');
        const conv = await ChatConversation.findByPk(conversationId, { attributes: ['id', 'user_id', 'visitor_id'] });
        if (!conv) return; // conv không tồn tại → không join
        const token = socket.handshake.auth?.token as string | undefined;
        if (token) {
          try {
            const payload = jwt.verify(token, env.jwt.accessSecret) as { id: number; role?: string };
            // Admin được join bất kỳ conv; user chỉ được join conv của mình
            if (payload.role === 'admin' || conv.user_id === payload.id) {
              socket.join(`chat:${conversationId}`);
            }
          } catch { /* token không hợp lệ */ }
        } else {
          // Visitor — yêu cầu visitorId khớp với conv.visitor_id
          const visitorId = socket.handshake.auth?.visitorId as string | undefined;
          if (visitorId && conv.visitor_id === visitorId) {
            socket.join(`chat:${conversationId}`);
          }
        }
      } catch { /* DB error — skip */ }
    });
    socket.on('chat:leave', (conversationId: number) => {
      socket.leave(`chat:${conversationId}`);
    });

    // Typing relay — broadcast đến room (trừ sender)
    socket.on('chat:typing', (data: { conversationId: number; typing: boolean; senderType?: string }) => {
      socket.to(`chat:${data.conversationId}`).emit('chat:typing', data);
      // Nếu từ user/visitor → notify admin dashboard
      if (data.senderType !== 'admin') {
        socket.to('admin:dashboard').emit('chat:typing', data);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket ngắt kết nối: ${socket.id}`);
    });
  });

  logger.info('Socket.IO khởi động thành công');
  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO chưa được khởi tạo');
  return io;
}

// Broadcast hoạt động admin lên room admin:dashboard (live activity feed)
export function broadcastAdminActivity(data: {
  type: string;
  entityType: string;
  entityId?: number;
  adminEmail?: string;
  description: string;
  timestamp?: string;
}) {
  try {
    const server = getIO();
    server.to('admin:dashboard').emit('admin:activity', {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
    });
  } catch { /* optional — không crash nếu Socket chưa init */ }
}
