import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import path from 'path';
import { sequelize } from '../../config/database';
import { Ticket } from '../../models/Ticket';
import { Booking } from '../../models/Booking';
import { BookingSeat } from '../../models/BookingSeat';
import { Seat } from '../../models/Seat';
import { Zone } from '../../models/Zone';
import { Event } from '../../models/Event';
import { Venue } from '../../models/Venue';
import { AppError } from '../../middleware/errorHandler.middleware';
import { env } from '../../config/env';
import { Op } from 'sequelize';

export class TicketsService {
  static async getUserTickets(userId: number, status?: string, page = 1, limit = 12) {
    const offset = (page - 1) * limit;
    const whereClause: Record<string, unknown> = { user_id: userId };
    if (status) whereClause.status = status;

    const { count, rows } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Seat,
          as: 'seat',
          include: [{ model: Zone, as: 'zone', attributes: ['name', 'price', 'color_code'] }],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'slug', 'banner_url', 'thumbnail_url', 'start_time', 'end_time', 'status'],
          include: [{ model: Venue, as: 'venue', attributes: ['name', 'city'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  static async getTicketDetail(ticketId: number, userId: number) {
    const ticket = await Ticket.findOne({
      where: { id: ticketId, user_id: userId },
      include: [
        {
          model: Seat,
          as: 'seat',
          include: [{ model: Zone, as: 'zone' }],
        },
        {
          model: Event,
          as: 'event',
          include: [{ model: Venue, as: 'venue' }],
        },
        {
          model: Booking,
          as: 'booking',
          include: [{ model: BookingSeat, as: 'bookingSeats' }],
        },
      ],
    });

    if (!ticket) throw new AppError('Không tìm thấy vé', 404);
    return ticket;
  }

  // Verify QR code (admin) — transaction + SELECT FOR UPDATE chống double-scan
  static async verifyQr(qrCode: string) {
    const decoded = jwt.verify(qrCode, env.jwt.qrSecret) as {
      ticketId: number; eventId: number; userId: number;
    };

    const t = await sequelize.transaction();
    try {
      const ticket = await Ticket.findOne({
        where: { id: decoded.ticketId, qr_code: qrCode },
        include: [
          { model: Event, as: 'event', attributes: ['title', 'start_time'] },
          { model: Seat, as: 'seat', include: [{ model: Zone, as: 'zone', attributes: ['name'] }] },
        ],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!ticket) throw new AppError('Vé không hợp lệ', 400);
      if (ticket.status === 'used') throw new AppError('Vé đã được sử dụng', 409);
      if (ticket.status === 'cancelled') throw new AppError('Vé đã bị hủy', 410);

      await ticket.update({ status: 'used', used_at: new Date() }, { transaction: t });
      await t.commit();
      return ticket;
    } catch (err) {
      await t.rollback().catch(() => {});
      throw err;
    }
  }

  // Tạo PDF vé
  static async generatePdf(ticketId: number, userId: number): Promise<Buffer> {
    const ticket = await Ticket.findOne({
      where: { id: ticketId, user_id: userId },
      include: [
        { model: Seat, as: 'seat', include: [{ model: Zone, as: 'zone' }] },
        { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
      ],
    });

    if (!ticket) throw new AppError('Không tìm thấy vé', 404);

    const t = ticket as unknown as {
      event: { title: string; start_time: Date; venue?: { name: string; address: string } };
      seat: { row_label: string; seat_number: number; zone?: { name: string; price: number } };
    };

    // Font paths — Roboto hỗ trợ đầy đủ Unicode/Vietnamese
    const fontDir = path.join(__dirname, '../../assets/fonts');
    const fontRegular = path.join(fontDir, 'NotoSans-Regular.ttf');
    const fontBold = path.join(fontDir, 'NotoSans-Bold.ttf');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Đăng ký font Roboto có Unicode/Vietnamese
      doc.registerFont('Regular', fontRegular);
      doc.registerFont('Bold', fontBold);

      // Header
      doc.fontSize(22).font('Bold').text('Ticket Rush', { align: 'center' });
      doc.fontSize(10).font('Regular').fillColor('#666').text('Vé sự kiện điện tử', { align: 'center' });
      doc.moveDown();

      // Divider
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#059669').lineWidth(2).stroke();
      doc.moveDown(0.5);

      // Event info
      doc.fontSize(16).font('Bold').fillColor('#000').text(t.event.title);
      doc.moveDown(0.3);
      doc.fontSize(11).font('Regular').fillColor('#333');
      doc.text(`Ngày: ${new Date(t.event.start_time).toLocaleString('vi-VN')}`);
      if (t.event.venue) doc.text(`Địa điểm: ${t.event.venue.name}`);
      doc.moveDown(0.5);

      // Ticket info
      doc.fontSize(14).font('Bold').fillColor('#059669');
      doc.text(`${t.seat.zone?.name ?? 'Khu'} - ${t.seat.row_label}${t.seat.seat_number}`);
      doc.fontSize(11).font('Regular').fillColor('#333');
      if (t.seat.zone?.price) doc.text(`Giá: ${Number(t.seat.zone.price).toLocaleString('vi-VN')}đ`);
      doc.moveDown(0.5);

      // Mã vé
      doc.fontSize(10).fillColor('#666').text(`Mã vé: #${String(ticketId).padStart(8, '0')}`);
      doc.text(`QR Code: ${ticket.qr_code.slice(0, 40)}...`);
      doc.moveDown();

      // Footer
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#999').text('Vui lòng xuất trình vé khi vào cổng. © 2026 Ticket Rush', { align: 'center' });

      doc.end();
    });
  }
}
