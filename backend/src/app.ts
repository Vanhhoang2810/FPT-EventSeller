import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { apiLimiter, speedLimiter } from './middleware/rateLimiter.middleware';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import eventsRoutes from './modules/events/events.routes';
import bookingRoutes from './modules/booking/booking.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';
import promoRoutes from './modules/promo/promo.routes';
import queueRoutes from './modules/queue/queue.routes';
import chatRoutes from './modules/chat/chat.routes';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Queue-Token'],
}));

// Compression + parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Debug: log request body (chỉ trong development)
if (env.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length) {
      // Mask các field nhạy cảm
      const body = { ...req.body };
      if (body.password) body.password = '[MASKED]';
      if (body.newPassword) body.newPassword = '[MASKED]';
      console.debug(`  → body: ${JSON.stringify(body)}`);
    }
    next();
  });
}

// Request ID middleware
app.use((req, _res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  next();
});

// Serve static files (avatar uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting + DDoS protection
app.use('/api', speedLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/chat',  chatRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.nodeEnv });
});

// 404 + Error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
