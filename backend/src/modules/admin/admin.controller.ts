import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { apiResponse } from '../../utils/apiResponse';

export class AdminController {
  // Dashboard
  static async dashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getDashboardStats();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  // Events
  static async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getEvents(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
        req.query.search as string,
        req.query.status as string,
      );
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await AdminService.createEvent(req.user!.id, {
        title: req.body.title,
        description: req.body.description,
        shortDescription: req.body.shortDescription,
        bannerUrl: req.body.bannerUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        category: req.body.category,
        venueId: req.body.venueId,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        saleStartTime: new Date(req.body.saleStartTime),
        saleEndTime: req.body.saleEndTime ? new Date(req.body.saleEndTime) : undefined,
        maxTicketsPerUser: req.body.maxTicketsPerUser,
        queueEnabled: req.body.queueEnabled,
      });
      apiResponse.created(res, event, 'Tạo sự kiện thành công');
    } catch (err) { next(err); }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await AdminService.updateEvent(req.user!.id, Number(req.params.id), req.body);
      apiResponse.success(res, event, 'Cập nhật sự kiện thành công');
    } catch (err) { next(err); }
  }

  static async updateEventStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await AdminService.updateEventStatus(req.user!.id, Number(req.params.id), req.body.status);
      apiResponse.success(res, event, 'Cập nhật trạng thái thành công');
    } catch (err) { next(err); }
  }

  static async setupZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.setupZones(req.user!.id, Number(req.params.id), req.body.zones);
      apiResponse.success(res, result, 'Cấu hình sơ đồ ghế thành công');
    } catch (err) { next(err); }
  }

  // Venues
  static async listVenues(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getVenues();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async createVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await AdminService.createVenue(req.body);
      apiResponse.created(res, venue, 'Tạo địa điểm thành công');
    } catch (err) { next(err); }
  }

  static async updateVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await AdminService.updateVenue(Number(req.params.id), req.body);
      apiResponse.success(res, venue, 'Cập nhật địa điểm thành công');
    } catch (err) { next(err); }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteEvent(req.user!.id, Number(req.params.id));
      apiResponse.success(res, null, 'Đã xóa sự kiện');
    } catch (err) { next(err); }
  }

  static async refundBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.refundBooking(req.user!.id, Number(req.params.id));
      apiResponse.success(res, null, 'Đã hoàn tiền thành công');
    } catch (err) { next(err); }
  }

  static async deleteVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.deleteVenue(Number(req.params.id));
      apiResponse.success(res, null, 'Đã xóa địa điểm');
    } catch (err) { next(err); }
  }

  // Users
  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUsers(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
        req.query.search as string,
      );
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  static async toggleBanUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.toggleBanUser(req.user!.id, Number(req.params.id));
      apiResponse.success(res, user);
    } catch (err) { next(err); }
  }

  // Bookings
  static async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getBookings(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
        req.query.status as string,
        req.query.eventId ? Number(req.query.eventId) : undefined,
        req.query.search as string,
        req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      );
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  // Charts
  static async revenueChart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string) || 'day';
      const validPeriods = ['hour', 'day', 'month', 'year'];
      const data = await AdminService.getRevenueChart(
        validPeriods.includes(period) ? (period as 'hour' | 'day' | 'month' | 'year') : 'day',
      );
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async seatFillStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getSeatFillStats();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async demographics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getDemographics();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async conversionFunnel(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getConversionFunnel();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async peakHours(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getPeakHours();
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  // Audit logs
  static async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getAuditLogs(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
        req.query.search as string | undefined,
        req.query.action as string | undefined,
      );
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  // User detail
  static async getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getUserDetail(Number(req.params.id));
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  // Reports export CSV
  static async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const { bookings } = await AdminService.getReportData(startDate, endDate);

      const header = 'Mã đơn,Khách hàng,Email,Sự kiện,Danh mục,Số tiền,Phương thức,Ngày đặt\n';
      const rows = (bookings as unknown as Array<Record<string, unknown>>).map((b) => {
        const user = b.user as Record<string, unknown> | undefined;
        const event = b.event as Record<string, unknown> | undefined;
        const payment = b.payment as Record<string, unknown> | undefined;
        return [
          b.id,
          `"${String(user?.full_name ?? '')}"`,
          user?.email ?? '',
          `"${String(event?.title ?? '')}"`,
          event?.category ?? '',
          payment?.amount ?? Math.max(0, Number(b.total_amount) - Number(b.discount_amount)),
          payment?.method ?? 'N/A',
          new Date(b.created_at as string).toLocaleDateString('vi-VN'),
        ].join(',');
      });

      const csv = header + rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${Date.now()}.csv"`);
      res.send('﻿' + csv); // BOM cho Excel đọc được tiếng Việt
    } catch (err) { next(err); }
  }
}
