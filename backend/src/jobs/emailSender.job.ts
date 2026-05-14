import { Queue, Worker } from 'bullmq';
import { EmailService } from '../modules/email/email.service';
import { logger } from '../utils/logger';
import type Redis from 'ioredis';

export const EMAIL_QUEUE_NAME = 'email-sender';

export type EmailTemplate = 'welcome' | 'verify' | 'booking-confirmed' | 'password-reset';

export interface EmailJobData {
  to: string;
  template: EmailTemplate;
  context: Record<string, unknown>;
}

let worker: Worker | null = null;
let queue: Queue | null = null;

async function dispatch(data: EmailJobData): Promise<void> {
  const { to, template, context } = data;
  switch (template) {
    case 'welcome':
      await EmailService.sendWelcomeEmail(to, String(context.name ?? ''));
      break;
    case 'booking-confirmed':
      await EmailService.sendBookingConfirmedEmail(
        to,
        String(context.name ?? ''),
        context.booking as Parameters<typeof EmailService.sendBookingConfirmedEmail>[2],
      );
      break;
    default:
      logger.warn(`Email template không xử lý: ${template}`);
  }
}

export function initEmailSenderJob(redisConnection: Redis) {
  queue = new Queue(EMAIL_QUEUE_NAME, { connection: redisConnection.duplicate() });

  worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const data = job.data as EmailJobData;
      try {
        await dispatch(data);
        logger.info(`Email gửi OK: ${data.template} → ${data.to}`);
      } catch (err) {
        logger.error(`Gửi email thất bại: ${data.template} → ${data.to}`, err as Error);
        throw err; // BullMQ sẽ retry
      }
    },
    { connection: redisConnection.duplicate(), concurrency: 5 },
  );

  worker.on('error', (err) => logger.error('Email worker lỗi:', err));
  logger.info('Email sender BullMQ worker đã khởi động (concurrency=5)');
}

export async function enqueueEmail(data: EmailJobData) {
  if (!queue) return;
  await queue.add('send-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

export function getEmailQueue() {
  return queue;
}
