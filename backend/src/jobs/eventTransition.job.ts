import { Queue, Worker } from 'bullmq';
import { Op } from 'sequelize';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { getIO } from '../config/socket';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../utils/logger';
import type Redis from 'ioredis';


const QUEUE_NAME = 'event-transition';

let worker: Worker | null = null;
let queue: Queue | null = null;

export function initEventTransitionJob(redisConnection: Redis) {
  queue = new Queue(QUEUE_NAME, { connection: redisConnection.duplicate() });
  // Dùng connection riêng cho dedup — tin cậy hơn RedisClient singleton (có thể fallback in-memory)
  const dedupRedis = redisConnection.duplicate();

  worker = new Worker(
    QUEUE_NAME,
    async () => {
      const now = new Date();

      // published → on_sale khi sale_start_time đến
      const toOnSale = await Event.findAll({
        where: {
          status: 'published',
          sale_start_time: { [Op.lte]: now },
          [Op.or]: [{ sale_end_time: null }, { sale_end_time: { [Op.gt]: now } }],
        },
      });
      for (const event of toOnSale) {
        await event.update({ status: 'on_sale' });
        try {
          getIO().emit('event:status-changed', { eventId: event.id, status: 'on_sale' });
        } catch { /* optional */ }
        logger.info(`Event #${event.id} "${event.title}" → on_sale`);
      }

      // on_sale → sold_out khi sale_end_time qua (không cho lock seats sau khi hết hạn bán)
      const saleEnded = await Event.findAll({
        where: {
          status: 'on_sale',
          sale_end_time: { [Op.lte]: now },
        },
      });
      for (const event of saleEnded) {
        await event.update({ status: 'sold_out' });
        logger.info(`Event #${event.id} "${event.title}" → sold_out (sale_end_time)`);
      }

      // on_sale/sold_out → completed khi end_time qua
      const toCompleted = await Event.findAll({
        where: {
          status: { [Op.in]: ['on_sale', 'sold_out'] },
          end_time: { [Op.lte]: now },
        },
      });
      for (const event of toCompleted) {
        await event.update({ status: 'completed' });
        logger.info(`Event #${event.id} "${event.title}" → completed`);
      }

      // Gửi reminder 24h trước sự kiện cho users có confirmed booking
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const reminderEvents = await Event.findAll({
        where: {
          status: { [Op.in]: ['on_sale', 'sold_out'] },
          start_time: { [Op.between]: [now, in24h] },
        },
      });

      for (const event of reminderEvents) {
        const sentKey = `reminder:sent:${event.id}`;
        // Dùng dedupRedis (connection riêng, không fallback in-memory) để dedup tin cậy
        const alreadySent = await dedupRedis.exists(sentKey).catch(() => 1);
        if (alreadySent) continue;

        const confirmedBookings = await Booking.findAll({
          where: { event_id: event.id, status: 'confirmed' },
        });

        for (const booking of confirmedBookings) {
          try {
            await NotificationsService.createAndPush(
              booking.user_id,
              'event_reminder',
              'Sự kiện sắp diễn ra!',
              `"${event.title}" diễn ra trong 24 giờ tới. Đừng quên mang vé!`,
              '/my-tickets',
            );
          } catch { /* notification optional */ }
        }

        // Đánh dấu đã gửi, TTL 26h
        await dedupRedis.setex(sentKey, 26 * 60 * 60, '1').catch(() => {});
        if (confirmedBookings.length > 0) {
          logger.info(`Đã gửi reminder event #${event.id} cho ${confirmedBookings.length} người`);
        }
      }
    },
    { connection: redisConnection.duplicate() },
  );

  worker.on('error', (err) => logger.error('Event transition worker lỗi:', err));

  // Chạy mỗi 5 phút
  queue
    .add('check-transitions', {}, {
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
    })
    .catch((err) => logger.error('Không thể khởi tạo event transition job:', err));

  logger.info('Event transition BullMQ job đã khởi động (mỗi 5 phút)');
}

export function getEventTransitionQueue() {
  return queue;
}
