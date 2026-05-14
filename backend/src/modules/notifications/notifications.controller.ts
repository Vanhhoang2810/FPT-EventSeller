import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { apiResponse } from '../../utils/apiResponse';

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationsService.getNotifications(req.user!.id, Number(req.query.page) || 1);
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  static async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await NotificationsService.getUnreadCount(req.user!.id);
      apiResponse.success(res, { count });
    } catch (err) { next(err); }
  }

  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationsService.markRead(Number(req.params.id), req.user!.id);
      apiResponse.success(res, null, 'Đã đánh dấu đã đọc');
    } catch (err) { next(err); }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationsService.markAllRead(req.user!.id);
      apiResponse.success(res, null, 'Đã đánh dấu tất cả đã đọc');
    } catch (err) { next(err); }
  }
}
