import { Request, Response, NextFunction } from 'express';
import { QueueService } from './queue.service';
import { apiResponse } from '../../utils/apiResponse';

export class QueueController {
  static async joinQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QueueService.joinQueue(req.user!.id, Number(req.params.eventId));
      apiResponse.success(res, result, 'Đã vào hàng đợi');
    } catch (err) { next(err); }
  }

  static async getPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QueueService.getQueuePosition(req.user!.id, Number(req.params.eventId));
      apiResponse.success(res, result);
    } catch (err) { next(err); }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await QueueService.getQueueStats(Number(req.params.eventId));
      apiResponse.success(res, stats);
    } catch (err) { next(err); }
  }

  static async grantBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await QueueService.grantBatch(Number(req.params.eventId));
      apiResponse.success(res, { granted: count });
    } catch (err) { next(err); }
  }

  static async toggleQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await QueueService.toggleQueue(Number(req.params.eventId), Boolean(req.body.enabled));
      apiResponse.success(res, null, 'Đã cập nhật trạng thái hàng đợi');
    } catch (err) { next(err); }
  }
}
