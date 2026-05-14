import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const IS_TEST = process.env.NODE_ENV === 'test';
const IS_DEV  = process.env.NODE_ENV === 'development';

// Rate limiter chung cho API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: IS_DEV ? 2000 : 200,  // thoải mái hơn trong dev
  skip: () => IS_TEST,
  message: { success: false, message: 'Quá nhiều request, vui lòng thử lại sau' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter nghiêm ngặt cho auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => IS_TEST,
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// DDoS protection — làm chậm response khi traffic bất thường
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: IS_TEST ? 1_000_000 : 500,   // bắt đầu delay sau 500 req (không phải 100)
  delayMs: (hits) => Math.min((hits - 500) * 50, 2000), // tối đa 2 giây, tăng chậm hơn
});

// Rate limiter cho password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: { success: false, message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ' },
});
