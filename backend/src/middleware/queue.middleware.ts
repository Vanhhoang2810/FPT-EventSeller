import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { QueueService } from '../modules/queue/queue.service';
import { AppError } from './errorHandler.middleware';

// Middleware chỉ VALIDATE token — không xóa ở đây.
// Token được xóa sau khi lockSeats thành công trong QueueService.consumeToken().
export async function verifyQueueToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = Number(req.body?.eventId ?? req.params?.eventId);
    if (!eventId) return next();

    const event = await Event.findByPk(eventId, { attributes: ['queue_enabled'] });
    if (!event?.queue_enabled) return next(); // Queue chưa bật → bỏ qua

    const token = req.headers['x-queue-token'] as string | undefined;
    if (!token) throw new AppError('Cần token hàng đợi để tiếp tục', 403);

    const valid = await QueueService.validateToken(token, req.user!.id);
    if (!valid) throw new AppError('Token hàng đợi không hợp lệ hoặc đã hết hạn. Vui lòng quay lại hàng đợi', 403);

    // Lưu token vào res.locals để controller có thể consume sau khi lock thành công
    res.locals.queueToken = token;
    res.locals.queueEventId = eventId;
    next();
  } catch (err) {
    next(err);
  }
}
