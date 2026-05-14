import { Queue, Worker } from 'bullmq';
import { Event } from '../models/Event';
import { QueueService } from '../modules/queue/queue.service';
import { logger } from '../utils/logger';
import type Redis from 'ioredis';

const QUEUE_NAME = 'queue-grant';

let worker: Worker | null = null;
let queue: Queue | null = null;

export function initQueueGrantJob(redisConnection: Redis) {
  queue = new Queue(QUEUE_NAME, { connection: redisConnection.duplicate() });

  worker = new Worker(
    QUEUE_NAME,
    async () => {
      // Tìm tất cả sự kiện đang bật hàng đợi ảo
      const activeEvents = await Event.findAll({
        where: { queue_enabled: true },
        attributes: ['id'],
      });

      if (activeEvents.length === 0) return;

      for (const event of activeEvents) {
        try {
          const stats = await QueueService.getQueueStats(event.id);
          if (stats.queueLength > 0) {
            const granted = await QueueService.grantBatch(event.id);
            if (granted > 0) {
              logger.info(`Queue grant job: event #${event.id} cấp ${granted} user(s)`);
            }
          }
        } catch (err) {
          logger.error(`Queue grant job lỗi event #${event.id}:`, err as Error);
        }
      }
    },
    { connection: redisConnection.duplicate() },
  );

  worker.on('error', (err) => logger.error('Queue grant worker lỗi:', err));

  queue
    .add('grant-batch', {}, {
      repeat: { every: 30000 },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
    })
    .catch((err) => logger.error('Không thể khởi tạo queue grant job:', err));

  logger.info('Queue grant BullMQ job đã khởi động (mỗi 30 giây)');
}
