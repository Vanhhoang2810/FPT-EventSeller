import { Router } from 'express';
import { QueueController } from './queue.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Customer
router.post('/events/:eventId/join', authenticate, QueueController.joinQueue);
router.get('/events/:eventId/position', authenticate, QueueController.getPosition);
router.get('/events/:eventId/stats', QueueController.getStats);

// Admin
router.post('/events/:eventId/grant', authenticate, requireAdmin, QueueController.grantBatch);
router.put('/events/:eventId/toggle', authenticate, requireAdmin, QueueController.toggleQueue);

export default router;
