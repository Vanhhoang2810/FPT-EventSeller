import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { verifyQueueToken } from '../../middleware/queue.middleware';
import { lockSeatsSchema, checkoutSchema } from './booking.validation';
import rateLimit from 'express-rate-limit';

const lockLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều yêu cầu giữ ghế, vui lòng thử lại sau' },
});

const router = Router();

// verifyQueueToken chỉ active khi event.queue_enabled=true
router.post('/lock-seats', authenticate, verifyQueueToken, lockLimiter, validate(lockSeatsSchema), BookingController.lockSeats);
// Kiểm tra pending booking cho event — dùng để redirect user trước khi chọn ghế
router.get('/pending', authenticate, BookingController.getMyPendingBooking);
// Danh sách booking của user — dùng cho profile/booking history
router.get('/', authenticate, BookingController.getMyBookings);
router.get('/:id', authenticate, BookingController.getBooking);
router.post('/:id/checkout', authenticate, validate(checkoutSchema), BookingController.checkout);
router.delete('/:id', authenticate, BookingController.cancel);
router.post('/:id/request-cancel', authenticate, BookingController.requestCancellation);

export default router;
