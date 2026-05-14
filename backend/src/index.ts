import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import app from './app';
import { sequelize } from './config/database';
import { initSocket } from './config/socket';
import { setupPassport } from './config/passport';
import { initBullMQJobs } from './jobs/index';
import { logger } from './utils/logger';
import { env } from './config/env';

// Import để đăng ký associations
import './models/index';

async function bootstrap() {
  try {
    // Kết nối DB
    await sequelize.authenticate();
    logger.info('Kết nối MySQL thành công');

    // Không dùng sync() trong production — dùng migrations
    if (env.nodeEnv === 'development') {
      logger.info('Mode development — dùng migrations để tạo DB schema');
    }

    // Setup passport
    setupPassport();

    // HTTP + Socket.IO
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // BullMQ background jobs (async — không block startup)
    initBullMQJobs().catch((err) => logger.error('BullMQ init lỗi:', err as Error));

    httpServer.listen(env.port, () => {
      logger.info(`Ticket Rush Backend chạy tại http://localhost:${env.port}`);
      logger.info(`Health check: http://localhost:${env.port}/health`);
    });
  } catch (err) {
    logger.error('Khởi động thất bại:', err as Error);
    process.exit(1);
  }
}

bootstrap();
