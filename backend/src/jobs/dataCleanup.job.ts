import { Queue, Worker } from 'bullmq';
import { Op } from 'sequelize';
import { Booking } from '../models/Booking';
import { BookingSeat } from '../models/BookingSeat';
import { RefreshToken } from '../models/RefreshToken';
import { Notification } from '../models/Notification';
import { logger } from '../utils/logger';
import type Redis from 'ioredis';

const QUEUE_NAME = 'data-cleanup';

let worker: Worker | null = null;

export function initDataCleanupJob(redisConnection: Redis) {
  const queue = new Queue(QUEUE_NAME, { connection: redisConnection.duplicate() });

  worker = new Worker(
    QUEUE_NAME,
    async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Xóa BookingSeat trước để tránh FK violation
      const expiredIds = await Booking.findAll({
        where: { status: 'expired', created_at: { [Op.lt]: thirtyDaysAgo } },
        attributes: ['id'],
      }).then((rows) => rows.map((r) => r.id));
      if (expiredIds.length > 0) {
        await BookingSeat.destroy({ where: { booking_id: expiredIds } });
      }

      const [deletedBookings, deletedTokens, deletedNotifs] = await Promise.all([
        // Dùng expiredIds đã fetch — không re-query để tránh orphan BookingSeat rows
        expiredIds.length > 0
          ? Booking.destroy({ where: { id: expiredIds } })
          : Promise.resolve(0),
        RefreshToken.destroy({
          where: {
            [Op.or]: [
              { expires_at: { [Op.lt]: new Date() } },
              { revoked: true, created_at: { [Op.lt]: sevenDaysAgo } },
            ],
          },
        }),
        Notification.destroy({
          where: { is_read: true, created_at: { [Op.lt]: ninetyDaysAgo } },
        }),
      ]);

      logger.info(
        `Data cleanup hoàn tất: ${deletedBookings} bookings, ${deletedTokens} tokens, ${deletedNotifs} notifications`,
      );
    },
    { connection: redisConnection.duplicate() },
  );

  worker.on('error', (err) => logger.error('Data cleanup worker lỗi:', err));

  // Chạy hàng ngày 3:00 AM
  queue
    .add('daily-cleanup', {}, {
      repeat: { pattern: '0 3 * * *' },
      removeOnComplete: { count: 7 },
      removeOnFail: { count: 3 },
    })
    .catch((err) => logger.error('Không thể khởi tạo data cleanup job:', err));

  logger.info('Data cleanup BullMQ job đã khởi động (hàng ngày 3:00 AM)');
}
