import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { Booking } from '../../models/Booking';
import { apiResponse } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler.middleware';

export class PaymentsController {
  static async createVnPay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await Booking.findOne({
        where: { id: Number(req.params.bookingId), user_id: req.user!.id, status: 'pending' },
      });
      if (!booking) { apiResponse.notFound(res, 'Không tìm thấy đơn đặt vé'); return; }
      const ipAddr = req.ip || '127.0.0.1';
      const url = PaymentsService.createVnPayUrl(booking, ipAddr);
      apiResponse.success(res, { url });
    } catch (err) { next(err); }
  }

  static async vnPayReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentsService.handleVnPayReturn(req.query as Record<string, string>);
      res.redirect(result.redirectUrl);
    } catch (err) { next(err); }
  }

  static async createMoMo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await Booking.findOne({
        where: { id: Number(req.params.bookingId), user_id: req.user!.id, status: 'pending' },
      });
      if (!booking) { apiResponse.notFound(res, 'Không tìm thấy đơn đặt vé'); return; }
      const data = await PaymentsService.createMoMoPayment(booking);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async vnPayIpn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentsService.handleVnPayIpn(req.query as Record<string, string>);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async momoIpn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentsService.handleMoMoIpn(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }
}
