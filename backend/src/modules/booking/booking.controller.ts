import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { QueueService } from '../queue/queue.service';
import { apiResponse } from '../../utils/apiResponse';

export class BookingController {
  static async lockSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, seatIds, standingSelections } = req.body;
      const result = await BookingService.lockSeats(req.user!.id, eventId, seatIds || [], standingSelections || []);

      // Consume queue token SAU KHI lock thành công (tránh mất token nếu lock thất bại)
      const queueToken = res.locals.queueToken as string | undefined;
      const queueEventId = res.locals.queueEventId as number | undefined;
      if (queueToken && queueEventId) {
        await QueueService.consumeToken(queueToken, req.user!.id, queueEventId).catch(() => {});
      }

      apiResponse.created(res, { bookingId: result.booking.id, expiresAt: result.expiresAt }, 'Đã giữ ghế thành công');
    } catch (err) { next(err); }
  }

  static async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await BookingService.getBooking(Number(req.params.id), req.user!.id);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BookingService.checkout(Number(req.params.id), req.user!.id, req.body);
      apiResponse.success(res, result, 'Thanh toán thành công');
    } catch (err) { next(err); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BookingService.cancelBooking(Number(req.params.id), req.user!.id);
      apiResponse.success(res, result, 'Đã hủy đơn đặt vé');
    } catch (err) { next(err); }
  }

  static async requestCancellation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BookingService.requestCancellation(
        Number(req.params.id),
        req.user!.id,
        req.body.reason,
      );
      apiResponse.success(res, result, 'Đã gửi yêu cầu hủy vé');
    } catch (err) { next(err); }
  }

  static async getMyPendingBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Number(req.query.eventId);
      if (!eventId || !Number.isInteger(eventId) || eventId <= 0) {
        apiResponse.error(res, 'eventId không hợp lệ', 400);
        return;
      }
      const result = await BookingService.getMyPendingBooking(req.user!.id, eventId);
      apiResponse.success(res, result);
    } catch (err) { next(err); }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const result = await BookingService.getMyBookings(req.user!.id, limit, offset);
      apiResponse.success(res, result);
    } catch (err) { next(err); }
  }
}
