import { getBullMQConnection } from '../config/redis';
import { initSeatReleaseJob } from './seatRelease.job';
import { initEventTransitionJob } from './eventTransition.job';
import { initEmailSenderJob } from './emailSender.job';
import { initDataCleanupJob } from './dataCleanup.job';
import { initQueueGrantJob } from './queueGrant.job';
import { logger } from '../utils/logger';

export async function initBullMQJobs() {
  const redisConn = await getBullMQConnection();

  if (!redisConn) {
    logger.warn('Không có Redis — BullMQ jobs bị bỏ qua (seat auto-release sẽ không hoạt động)');
    return;
  }

  try {
    initSeatReleaseJob(redisConn);
    initEventTransitionJob(redisConn);
    initEmailSenderJob(redisConn);
    initDataCleanupJob(redisConn);
    initQueueGrantJob(redisConn);
    logger.info('Tất cả BullMQ jobs đã khởi động');
  } catch (err) {
    logger.error('Khởi động BullMQ jobs thất bại:', err as Error);
  }
}
