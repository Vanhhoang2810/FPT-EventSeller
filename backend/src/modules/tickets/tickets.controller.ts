import { Request, Response, NextFunction } from 'express';
import { TicketsService } from './tickets.service';
import { apiResponse } from '../../utils/apiResponse';

export class TicketsController {
  static async getMyTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TicketsService.getUserTickets(
        req.user!.id,
        req.query.status as string,
        Number(req.query.page) || 1,
      );
      apiResponse.paginated(res, result.data as never[], result.pagination);
    } catch (err) { next(err); }
  }

  static async getTicketDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TicketsService.getTicketDetail(Number(req.params.id), req.user!.id);
      apiResponse.success(res, data);
    } catch (err) { next(err); }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pdfBuffer = await TicketsService.generatePdf(Number(req.params.id), req.user!.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${req.params.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) { next(err); }
  }

  static async verifyQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TicketsService.verifyQr(req.body.qrCode);
      apiResponse.success(res, data, 'Xác thực vé thành công');
    } catch (err) { next(err); }
  }
}
