import crypto from 'crypto';
import { RedisClient } from '../../config/redis';
import { getIO } from '../../config/socket';
import { Event } from '../../models/Event';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logger } from '../../utils/logger';

const TOKEN_TTL_SECONDS = 300; // 5 phút
const DEFAULT_BATCH_SIZE = 50;
const QUEUE_THRESHOLD = Number(process.env.QUEUE_THRESHOLD || 200);

export class QueueService {
  static async joinQueue(userId: number, eventId: number) {
    const event = await Event.findByPk(eventId, { attributes: ['id', 'queue_enabled', 'queue_batch_size'] });
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);
    if (!event.queue_enabled) throw new AppError('Hàng đợi chưa được bật cho sự kiện này', 400);

    const redis = RedisClient.getClient();
    const queueKey = `queue:event:${eventId}`;
    const activeKey = `queue:active:${eventId}`;

    if (!redis || redis.status !== 'ready') return { position: 1, estimatedWait: 2, isActive: false };

    // Đang active → trả kèm token để frontend dùng khi WebSocket bị miss
    const isActive = (await redis.sismember(activeKey, String(userId))) === 1;
    if (isActive) {
      const token = await redis.get(`queue:user_token:${userId}:${eventId}`);
      return { position: 0, estimatedWait: 0, isActive: true, token };
    }

    // Đã trong queue → trả vị trí hiện tại
    const existingScore = await redis.zscore(queueKey, String(userId));
    if (existingScore) {
      const rank = (await redis.zrank(queueKey, String(userId))) ?? 0;
      const position = rank + 1;
      const batchSize = event.queue_batch_size ?? DEFAULT_BATCH_SIZE;
      return { position, estimatedWait: Math.ceil(position / batchSize) * 2, isActive: false };
    }

    // Thêm mới vào sorted set với score = join timestamp
    await redis.zadd(queueKey, Date.now(), String(userId));
    const rank = (await redis.zrank(queueKey, String(userId))) ?? 0;
    const position = rank + 1;
    const batchSize = event.queue_batch_size ?? DEFAULT_BATCH_SIZE;

    logger.info(`User #${userId} vào hàng đợi event #${eventId}, vị trí: ${position}`);
    return { position, estimatedWait: Math.ceil(position / batchSize) * 2, isActive: false };
  }

  static async getQueuePosition(userId: number, eventId: number) {
    const redis = RedisClient.getClient();
    if (!redis || redis.status !== 'ready') return { position: 0, estimatedWait: 0, isActive: true };

    const queueKey = `queue:event:${eventId}`;
    const activeKey = `queue:active:${eventId}`;

    const isActive = (await redis.sismember(activeKey, String(userId))) === 1;
    if (isActive) {
      const token = await redis.get(`queue:user_token:${userId}:${eventId}`);
      return { position: 0, estimatedWait: 0, isActive: true, token };
    }

    const rank = await redis.zrank(queueKey, String(userId));
    if (rank === null) return { position: -1, estimatedWait: 0, isActive: false };

    const position = rank + 1;
    const event = await Event.findByPk(eventId, { attributes: ['queue_batch_size'] });
    const batchSize = event?.queue_batch_size ?? DEFAULT_BATCH_SIZE;
    return { position, estimatedWait: Math.ceil(position / batchSize) * 2, isActive: false };
  }

  static async grantBatch(eventId: number): Promise<number> {
    const redis = RedisClient.getClient();
    if (!redis) return 0;

    const event = await Event.findByPk(eventId, { attributes: ['queue_batch_size'] });
    const batchSize = event?.queue_batch_size ?? DEFAULT_BATCH_SIZE;
    const queueKey = `queue:event:${eventId}`;
    const activeKey = `queue:active:${eventId}`;

    const users = await redis.zrange(queueKey, 0, batchSize - 1);
    if (users.length === 0) return 0;

    let io: ReturnType<typeof getIO> | null = null;
    try { io = getIO(); } catch { /* optional */ }

    for (const userIdStr of users) {
      const token = crypto.randomBytes(32).toString('hex');
      // H5 fix: MULTI/EXEC atomic — kiểm tra kết quả để không emit token phantom khi pipeline fail
      const results = await redis.multi()
        .setex(`queue:token:${token}`, TOKEN_TTL_SECONDS, userIdStr)
        .setex(`queue:user_token:${userIdStr}:${eventId}`, TOKEN_TTL_SECONDS, token)
        .sadd(activeKey, userIdStr)
        .zrem(queueKey, userIdStr)
        .exec();

      if (!results || results.some(([err]) => err !== null)) {
        logger.error(`Queue grant pipeline failed for user ${userIdStr}`);
        continue;
      }

      try {
        io?.to(`user:${userIdStr}`).emit('queue:granted', {
          token,
          expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
        });
      } catch { /* optional */ }
    }

    // Broadcast vị trí mới cho phần còn lại
    const remaining = await redis.zrange(queueKey, 0, -1);
    for (let i = 0; i < remaining.length; i++) {
      const position = i + 1;
      try {
        io?.to(`user:${remaining[i]}`).emit('queue:position', {
          position,
          estimatedWait: Math.ceil(position / batchSize) * 2,
        });
      } catch { /* optional */ }
    }

    logger.info(`Queue grant event #${eventId}: ${users.length} users`);
    return users.length;
  }

  // Chỉ kiểm tra token hợp lệ — KHÔNG xóa (dùng trong middleware)
  static async validateToken(token: string, userId: number): Promise<boolean> {
    const redis = RedisClient.getClient();
    if (!redis || redis.status !== 'ready') return false; // Fail closed — không bypass queue khi Redis unavailable

    const stored = await redis.get(`queue:token:${token}`);
    return !!stored && Number(stored) === userId;
  }

  // Xóa token + cleanup active set sau khi lock-seats thành công
  static async consumeToken(token: string, userId: number, eventId: number): Promise<void> {
    const redis = RedisClient.getClient();
    if (!redis || redis.status !== 'ready') return;

    await redis.del(`queue:token:${token}`);
    await redis.del(`queue:user_token:${userId}:${eventId}`);
    await redis.srem(`queue:active:${eventId}`, String(userId));
  }

  // Giữ lại verifyToken cho backward compat (validate + consume trong 1 bước — dùng khi không cần tách)
  static async verifyToken(token: string, userId: number, eventId?: number): Promise<boolean> {
    const valid = await this.validateToken(token, userId);
    if (!valid) return false;
    if (eventId) await this.consumeToken(token, userId, eventId);
    return true;
  }

  // Auto-enable queue khi WebSocket connections vượt ngưỡng
  static async checkAutoEnable(eventId: number): Promise<void> {
    try {
      const io = getIO();
      const sockets = await io.in(`event:${eventId}`).fetchSockets();
      if (sockets.length < QUEUE_THRESHOLD) return;

      const event = await Event.findByPk(eventId, { attributes: ['id', 'queue_enabled'] });
      if (event && !event.queue_enabled) {
        await event.update({ queue_enabled: true });
        logger.info(`Auto-enable queue event #${eventId} (${sockets.length} connections)`);
      }
    } catch { /* optional */ }
  }

  static async toggleQueue(eventId: number, enabled: boolean): Promise<void> {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);
    await event.update({ queue_enabled: enabled });
  }

  static async getQueueStats(eventId: number) {
    const event = await Event.findByPk(eventId, { attributes: ['queue_enabled'] });
    if (!event) return { queueLength: 0, activeCount: 0, isEnabled: false };

    const redis = RedisClient.getClient();
    if (!redis || redis.status !== 'ready') {
      return { queueLength: 0, activeCount: 0, isEnabled: event.queue_enabled };
    }

    try {
      const [queueLength, activeCount] = await Promise.all([
        redis.zcard(`queue:event:${eventId}`),
        redis.scard(`queue:active:${eventId}`),
      ]);
      return { queueLength, activeCount, isEnabled: event.queue_enabled };
    } catch {
      return { queueLength: 0, activeCount: 0, isEnabled: event.queue_enabled };
    }
  }
}
