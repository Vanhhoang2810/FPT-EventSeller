import { Request, Response, NextFunction } from 'express';
import { EventsService } from './events.service';
import { apiResponse } from '../../utils/apiResponse';
import type { ListEventsQuery } from './events.validation';

export class EventsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Dùng req.validated (đã coerce qua Zod) hoặc fallback về req.query
      const query = (req.validated ?? req.query) as ListEventsQuery;
      const result = await EventsService.list(query, req.user?.id);
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  static async featured(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.getFeatured();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async trending(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.getTrending();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async suggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.validated?.q ?? req.query.q ?? '');
      const data = await EventsService.getSuggestions(q);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async favorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EventsService.getUserFavorites(req.user!.id);
      apiResponse.success(res, result.data);
    } catch (err) { next(err); }
  }

  static async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.getByIdOrSlug(String(req.params.idOrSlug), req.user?.id);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async seatMap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.getSeatMap(Number(req.params.id));
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.toggleFavorite(req.user!.id, Number(req.params.id));
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async remind(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventsService.remindMe(req.user!.id, Number(req.params.id));
      apiResponse.success(res, data, 'Đã đăng ký nhắc nhở');
    } catch (err) { next(err); }
  }
}
