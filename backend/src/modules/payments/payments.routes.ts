import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/:bookingId/vnpay/create', authenticate, PaymentsController.createVnPay);
router.get('/vnpay/return', PaymentsController.vnPayReturn);
router.get('/vnpay/ipn', PaymentsController.vnPayIpn);
router.post('/:bookingId/momo/create', authenticate, PaymentsController.createMoMo);
router.post('/momo/ipn', PaymentsController.momoIpn);

export default router;
