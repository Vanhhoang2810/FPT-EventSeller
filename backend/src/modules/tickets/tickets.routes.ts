import { Router } from 'express';
import { TicketsController } from './tickets.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, TicketsController.getMyTickets);
router.get('/:id', authenticate, TicketsController.getTicketDetail);
router.get('/:id/pdf', authenticate, TicketsController.downloadPdf);
router.post('/verify', authenticate, requireAdmin, TicketsController.verifyQr);

export default router;
