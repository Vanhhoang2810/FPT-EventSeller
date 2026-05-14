import { Queue, Worker } from 'bullmq';
import { Op } from 'sequelize';
import { Booking } from '../models/Booking';
import { BookingSeat } from '../models/BookingSeat';
import { Seat } from '../models/Seat';
import { sequelize } from '../config/database';
import { getIO } from '../config/socket';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../utils/logger';
import type Redis from 'ioredis';

const QUEUE_NAME = 'seat-release';

let worker: Worker | null = null;
let queue: Queue | null = null;

export function initSeatReleaseJob(redisConnection: Redis) {
  // BullMQ: Queue và Worker cần connection riêng
  queue = new Queue(QUEUE_NAME, { connection: redisConnection.duplicate() });

  worker = new Worker(
    QUEUE_NAME,
    async () => {
      const now = new Date();

      const expiredBookings = await Booking.findAll({
        where: { status: 'pending', expires_at: { [Op.lte]: now } },
      });

      if (expiredBookings.length === 0) return;

      logger.info(`Seat release job: ${expiredBookings.length} booking(s) hết hạn`);

      for (const booking of expiredBookings) {
        const t = await sequelize.transaction();
        try {
          // H4 fix: UPDATE với WHERE status='pending' — chống race condition khi payment callback
          // xác nhận booking ngay trước lúc job chạy
          const [updated] = await Booking.update(
            { status: 'expired' },
            { where: { id: booking.id, status: 'pending' }, transaction: t },
          );
          if (updated === 0) {
            // Booking đã được confirm hoặc cancel bởi process khác → bỏ qua
            await t.rollback();
            continue;
          }

          const bookingSeats = await BookingSeat.findAll({
            where: { booking_id: booking.id },
            transaction: t,
          });
          const seatIds = bookingSeats.map((bs) => bs.seat_id);

          await Seat.update(
            { status: 'available', locked_by: null, locked_at: null },
            { where: { id: seatIds, status: 'locked' }, transaction: t },
          );

          await t.commit();

          try {
            const io = getIO();
            io.to(`event:${booking.event_id}`).emit('seat:bulk-updated', {
              seats: seatIds.map((id) => ({ seatId: id, status: 'available' })),
            });
            io.to(`user:${booking.user_id}`).emit('booking:expired', { bookingId: booking.id });
          } catch { /* WebSocket optional */ }

          try {
            await NotificationsService.createAndPush(
              booking.user_id,
              'booking_expired',
              'Đơn đặt vé đã hết hạn',
              'Đơn đặt vé của bạn đã hết thời gian giữ chỗ. Ghế đã được giải phóng.',
              '/events',
            );
          } catch { /* notification optional */ }
        } catch (err) {
          await t.rollback().catch(() => {});
          logger.error(`Không thể expire booking #${booking.id}:`, err as Error);
        }
      }
    },
    { connection: redisConnection.duplicate() },
  );

  worker.on('error', (err) => logger.error('Seat release worker lỗi:', err));

  queue
    .add('check-expired', {}, {
      repeat: { every: 30000 },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
    })
    .catch((err) => logger.error('Không thể khởi tạo seat release job:', err));

  logger.info('Seat release BullMQ job đã khởi động (mỗi 30 giây)');
}

export function getSeatReleaseQueue() {
  return queue;
}
