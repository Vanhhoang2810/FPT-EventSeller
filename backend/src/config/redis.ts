import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

function createRedisClient(): Redis | null {
  try {
    const client = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null; // Dừng retry sau 3 lần
        return Math.min(times * 200, 1000);
      },
    });

    client.on('connect', () => logger.info('Kết nối Redis thành công'));
    client.on('error', (err) => logger.warn(`Redis lỗi: ${err.message} — chuyển sang in-memory`));
    client.on('close', () => logger.warn('Redis ngắt kết nối'));

    return client;
  } catch {
    logger.warn('Không thể khởi tạo Redis — dùng in-memory fallback');
    return null;
  }
}

// In-memory fallback khi không có Redis
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function cleanMemoryStore() {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiresAt && item.expiresAt < now) memoryStore.delete(key);
  }
}
setInterval(cleanMemoryStore, 60000);

export class RedisClient {
  private static client: Redis | null = createRedisClient();

  static async get(key: string): Promise<string | null> {
    if (this.client) {
      try { return await this.client.get(key); } catch { /* fallthrough */ }
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) { memoryStore.delete(key); return null; }
    return item.value;
  }

  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) await this.client.setex(key, ttlSeconds, value);
        else await this.client.set(key, value);
        return;
      } catch { /* fallthrough */ }
    }
    memoryStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  }

  static async del(key: string): Promise<void> {
    if (this.client) {
      try { await this.client.del(key); return; } catch { /* fallthrough */ }
    }
    memoryStore.delete(key);
  }

  static async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  static async incr(key: string): Promise<number> {
    if (this.client) {
      try { return await this.client.incr(key); } catch { /* fallthrough */ }
    }
    const item = memoryStore.get(key);
    const newVal = item ? Number(item.value) + 1 : 1;
    memoryStore.set(key, { value: String(newVal), expiresAt: item?.expiresAt || 0 });
    return newVal;
  }

  static getClient(): Redis | null {
    return this.client;
  }
}

// BullMQ yêu cầu maxRetriesPerRequest: null — tạo connection riêng
// Trả về null nếu Redis không khả dụng (kiểm tra ping trước)
export async function getBullMQConnection(): Promise<Redis | null> {
  try {
    const probe = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: null,
    });
    probe.on('error', () => {}); // Suppress unhandled error event trong probe
    await probe.connect();
    await probe.ping();
    probe.disconnect();

    // Redis khả dụng → tạo connection thật
    const client = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 3000)),
    });
    client.on('error', (err) => logger.warn(`BullMQ Redis lỗi: ${err.message}`));
    return client;
  } catch {
    logger.warn('Redis không khả dụng — BullMQ jobs bị bỏ qua');
    return null;
  }
}
