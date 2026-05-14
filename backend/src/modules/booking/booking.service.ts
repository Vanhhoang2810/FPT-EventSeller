import { Transaction, Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { Event } from '../../models/Event';
import { Seat } from '../../models/Seat';
import { Zone } from '../../models/Zone';
import { Booking } from '../../models/Booking';
import { BookingSeat } from '../../models/BookingSeat';
import { Ticket } from '../../models/Ticket';
import { Payment } from '../../models/Payment';
import { PromoCode } from '../../models/PromoCode';
import { PromoUsage } from '../../models/PromoUsage';
import { Venue } from '../../models/Venue';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getIO } from '../../config/socket';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import type { CheckoutInput } from './booking.validation';

const BOOKING_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút

export class BookingService {
  // ★ Lock ghế — pessimistic locking với SELECT FOR UPDATE
  static async lockSeats(userId: number, eventId: number, seatIds: number[]) {
    const now = new Date();

    // Tự động expire các booking pending đã hết hạn (chưa có BullMQ job)
    const expiredBookings = await Booking.findAll({
      where: { user_id: userId, event_id: eventId, status: 'pending', expires_at: { [Op.lte]: now } },
    });
    for (const expired of expiredBookings) {
      await this.expireBooking(expired).catch(() => {});
    }

    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);
    if (!['on_sale'].includes(event.status)) {
      throw new AppError('Sự kiện này chưa mở bán vé', 400);
    }

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // Kiểm tra pending booking trong transaction — chống TOCTOU với LOCK.UPDATE
      const existingBooking = await Booking.findOne({
        where: { user_id: userId, event_id: eventId, status: 'pending', expires_at: { [Op.gt]: now } },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      if (existingBooking) {
        await transaction.rollback();
        throw new AppError('Bạn đã có đơn đang chờ thanh toán cho sự kiện này', 409);
      }

      // SELECT FOR UPDATE — khóa các hàng để ngăn đọc đồng thời
      const seats = await Seat.findAll({
        where: { id: seatIds, status: 'available' },
        include: [{ model: Zone, as: 'zone', attributes: ['id', 'name', 'price', 'color_code'] }],
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (seats.length !== seatIds.length) {
        await transaction.rollback();
        throw new AppError('Một hoặc nhiều ghế đã được người khác chọn. Vui lòng chọn ghế khác', 409);
      }

      // Kiểm tra giới hạn vé/người — tính cả seats đang lock trong pending bookings
      const [confirmedTickets, pendingSeats] = await Promise.all([
        Ticket.count({ where: { user_id: userId, event_id: eventId, status: 'active' }, transaction }),
        BookingSeat.count({
          include: [{ model: Booking, as: 'booking', where: { user_id: userId, event_id: eventId, status: 'pending' }, attributes: [] }],
          transaction,
        }),
      ]);
      if (confirmedTickets + pendingSeats + seats.length > event.max_tickets_per_user) {
        await transaction.rollback();
        throw new AppError(`Tối đa ${event.max_tickets_per_user} vé/người cho sự kiện này`, 400);
      }

      // Kiểm tra tất cả ghế thuộc event này
      const zoneIds = [...new Set(seats.map((s) => s.zone_id))];
      const zones = await Zone.findAll({ where: { id: zoneIds, event_id: eventId }, transaction });
      if (zones.length !== zoneIds.length) {
        await transaction.rollback();
        throw new AppError('Ghế không thuộc sự kiện này', 400);
      }

      // Lock ghế
      await Seat.update(
        { status: 'locked', locked_by: userId, locked_at: new Date() },
        { where: { id: seatIds }, transaction },
      );

      const totalAmount = seats.reduce((sum, s) => {
        const zone = (s as unknown as { zone: { price: number } }).zone;
        return sum + Number(zone?.price || 0);
      }, 0);

      const expiresAt = new Date(Date.now() + BOOKING_TIMEOUT_MS);

      const booking = await Booking.create(
        {
          user_id: userId,
          event_id: eventId,
          status: 'pending',
          total_amount: totalAmount,
          seat_count: seats.length,
          expires_at: expiresAt,
          discount_amount: 0,
        },
        { transaction },
      );

      await BookingSeat.bulkCreate(
        seats.map((s) => ({
          booking_id: booking.id,
          seat_id: s.id,
          price: Number((s as unknown as { zone: { price: number } }).zone?.price || 0),
        })),
        { transaction },
      );

      await transaction.commit();

      // Broadcast real-time qua WebSocket
      try {
        const io = getIO();
        io.to(`event:${eventId}`).emit('seat:bulk-updated', {
          seats: seatIds.map((id) => ({ seatId: id, status: 'locked' })),
        });
      } catch { /* WebSocket optional */ }

      return { booking, expiresAt };
    } catch (err) {
      await transaction.rollback().catch(() => {});
      throw err;
    }
  }

  // Lấy chi tiết booking
  static async getBooking(bookingId: number, userId: number) {
    const booking = await Booking.findOne({
      where: { id: bookingId, user_id: userId },
      include: [
        {
          model: BookingSeat,
          as: 'bookingSeats',
          include: [{ model: Seat, as: 'seat', include: [{ model: Zone, as: 'zone' }] }],
        },
        {
          model: Event,
          as: 'event',
          include: [{ model: Venue, as: 'venue' }],
        },
        { model: Payment, as: 'payment' },
      ],
    });

    if (!booking) throw new AppError('Không tìm thấy đơn đặt vé', 404);
    return booking;
  }

  // Checkout (xác nhận thanh toán)
  static async checkout(bookingId: number, userId: number, input: CheckoutInput) {
    const booking = await Booking.findOne({
      where: { id: bookingId, user_id: userId, status: 'pending' },
      include: [{
        model: BookingSeat,
        as: 'bookingSeats',
        include: [{ model: Seat, as: 'seat', include: [{ model: Zone, as: 'zone' }] }],
      }],
    });

    if (!booking) throw new AppError('Không tìm thấy đơn đặt vé', 404);

    // Kiểm tra hết hạn
    if (booking.expires_at < new Date()) {
      await this.expireBooking(booking);
      throw new AppError('Đã hết thời gian giữ chỗ (10 phút). Vui lòng chọn lại ghế', 410);
    }

    // Áp dụng promo code nếu có
    let discountAmount = 0;
    let promoCodeId: number | null = null;
    if (input.promoCode) {
      const promo = await this.validateAndApplyPromo(input.promoCode, userId, booking);
      discountAmount = promo.discountAmount;
      promoCodeId = promo.promoCodeId;
    }

    const finalAmount = Math.max(0, booking.total_amount - discountAmount);

    if (input.method === 'simulated') {
      return this.confirmBooking(booking, finalAmount, discountAmount, promoCodeId, 'simulated', null);
    }

    // Idempotency: nếu đã có pending payment → trả lại thay vì tạo thêm (tránh double-charge khi retry)
    const existingPayment = await Payment.findOne({ where: { booking_id: booking.id, status: 'pending' } });
    if (existingPayment) {
      return { bookingId: booking.id, paymentId: existingPayment.id, method: existingPayment.method, amount: Number(existingPayment.amount) };
    }

    // VNPay/MoMo → tạo payment pending + cập nhật discount trong transaction
    const tx = await sequelize.transaction();
    let payment: Payment;
    try {
      payment = await Payment.create({
        booking_id: booking.id,
        amount: finalAmount,
        method: input.method,
        status: 'pending',
      }, { transaction: tx });

      if (discountAmount > 0) {
        await booking.update({ discount_amount: discountAmount, promo_code_id: promoCodeId }, { transaction: tx });
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback().catch(() => {});
      throw err;
    }

    return { bookingId: booking.id, paymentId: payment.id, method: input.method, amount: finalAmount };
  }

  // Xác nhận booking (dùng chung cho simulated + callback)
  static async confirmBooking(
    booking: Booking,
    amount: number,
    discountAmount: number,
    promoCodeId: number | null,
    method: 'simulated' | 'vnpay' | 'momo',
    transactionId: string | null,
  ) {
    const t = await sequelize.transaction();
    try {
      // Optimistic lock: chỉ update khi booking vẫn đang ở trạng thái pending
      // Tránh race condition khi callback VNPay và BullMQ expiry job chạy đồng thời
      const [affectedRows] = await Booking.update({
        status: 'confirmed',
        confirmed_at: new Date(),
        total_amount: amount,
        discount_amount: discountAmount,
        promo_code_id: promoCodeId,
      }, { where: { id: booking.id, status: 'pending' }, transaction: t });

      if (affectedRows === 0) {
        await t.rollback();
        throw new AppError('Đơn đặt vé không còn ở trạng thái chờ xử lý', 409);
      }

      // Upsert payment: update pending record nếu có, tạo mới nếu là simulated
      const [updatedCount] = await Payment.update({
        status: 'completed',
        transaction_id: transactionId,
        paid_at: new Date(),
        amount,
      }, { where: { booking_id: booking.id, status: 'pending' }, transaction: t });

      if (updatedCount === 0) {
        // simulated hoặc không có pending payment → tạo mới
        await Payment.create({
          booking_id: booking.id,
          amount,
          method,
          status: 'completed',
          transaction_id: transactionId,
          paid_at: new Date(),
        }, { transaction: t });
      }

      // Ghi nhận promo usage sau khi booking được xác nhận
      if (promoCodeId) {
        await PromoUsage.create({
          promo_id: promoCodeId,
          user_id: booking.user_id,
          booking_id: booking.id,
          discount_amount: discountAmount,
        }, { transaction: t });

        // Atomic increment — chỉ tăng nếu chưa vượt usage_limit (chống race condition)
        const [result] = await sequelize.query(
          'UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = :id AND (usage_limit IS NULL OR usage_count < usage_limit)',
          { replacements: { id: promoCodeId }, transaction: t, type: QueryTypes.UPDATE },
        );
        if ((result as unknown as number) === 0) {
          throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
        }
      }

      // Lấy booking seats để tạo tickets
      const bookingSeats = await BookingSeat.findAll({
        where: { booking_id: booking.id },
        transaction: t,
      });

      // Đánh dấu ghế là sold
      const seatIds = bookingSeats.map((bs) => bs.seat_id);
      await Seat.update({ status: 'sold', locked_by: null, locked_at: null }, {
        where: { id: seatIds },
        transaction: t,
      });

      // Tạo tickets với QR signed JWT
      const tickets = await Ticket.bulkCreate(
        bookingSeats.map((bs) => ({
          booking_id: booking.id,
          seat_id: bs.seat_id,
          user_id: booking.user_id,
          event_id: booking.event_id,
          qr_code: jwt.sign(
            { ticketId: 0, bookingId: booking.id, seatId: bs.seat_id, eventId: booking.event_id, userId: booking.user_id, issuedAt: Date.now() },
            env.jwt.qrSecret,
            { expiresIn: '365d' } as never,
          ),
          status: 'active' as const,
        })),
        { transaction: t },
      );

      // Cập nhật lại qr_code với ticketId thực
      for (const ticket of tickets) {
        const newQr = jwt.sign(
          { ticketId: ticket.id, bookingId: booking.id, seatId: ticket.seat_id, eventId: booking.event_id, userId: booking.user_id, issuedAt: Date.now() },
          env.jwt.qrSecret,
          { expiresIn: '365d' } as never,
        );
        await ticket.update({ qr_code: newQr }, { transaction: t });
      }

      await t.commit();

      // Broadcast seat sold
      try {
        const io = getIO();
        io.to(`event:${booking.event_id}`).emit('seat:bulk-updated', {
          seats: seatIds.map((id) => ({ seatId: id, status: 'sold' })),
        });
      } catch { /* optional */ }

      return { booking, tickets };
    } catch (err) {
      await t.rollback().catch(() => {});
      throw err;
    }
  }

  // Expire booking — release ghế
  static async expireBooking(booking: Booking) {
    const t = await sequelize.transaction();
    try {
      const bookingSeats = await BookingSeat.findAll({ where: { booking_id: booking.id }, transaction: t });
      const seatIds = bookingSeats.map((bs) => bs.seat_id);

      await Seat.update({ status: 'available', locked_by: null, locked_at: null }, {
        where: { id: seatIds, status: 'locked' },
        transaction: t,
      });

      // WHERE status='pending' — tránh overwrite booking đã confirmed bởi payment callback đồng thời
      const [affected] = await Booking.update(
        { status: 'expired' },
        { where: { id: booking.id, status: 'pending' }, transaction: t },
      );
      if (affected === 0) { await t.rollback(); return; } // đã confirmed/cancelled → bỏ qua
      await t.commit();

      try {
        const io = getIO();
        io.to(`event:${booking.event_id}`).emit('seat:bulk-updated', {
          seats: seatIds.map((id) => ({ seatId: id, status: 'available' })),
        });
      } catch { /* optional */ }
    } catch (err) {
      await t.rollback().catch(() => {});
      throw err;
    }
  }

  // Lấy pending booking còn hạn của user cho 1 event (dùng để check trước khi chọn ghế)
  static async getMyPendingBooking(userId: number, eventId: number) {
    const now = new Date();
    const booking = await Booking.findOne({
      where: { user_id: userId, event_id: eventId, status: 'pending', expires_at: { [Op.gt]: now } },
      attributes: ['id'],
    });
    return booking ? { bookingId: booking.id } : null;
  }

  // Hủy booking
  static async cancelBooking(bookingId: number, userId: number) {
    const booking = await Booking.findOne({
      where: { id: bookingId, user_id: userId, status: 'pending' },
    });
    if (!booking) throw new AppError('Không tìm thấy đơn chờ thanh toán', 404);
    await this.expireBooking(booking);
    return { cancelled: true };
  }

  // Yêu cầu hủy vé (confirmed booking) — admin sẽ xử lý refund
  static async requestCancellation(bookingId: number, userId: number, reason?: string) {
    const booking = await Booking.findOne({
      where: { id: bookingId, user_id: userId, status: 'confirmed' },
    });
    if (!booking) throw new AppError('Không tìm thấy đơn đã xác nhận', 404);
    if (booking.cancellation_requested) throw new AppError('Đã gửi yêu cầu hủy trước đó', 400);

    await booking.update({
      cancellation_requested: true,
      cancellation_reason: reason ?? null,
    });
    return { requested: true, bookingId };
  }

  // Validate + apply promo code
  private static async validateAndApplyPromo(
    code: string,
    userId: number,
    booking: Booking,
  ): Promise<{ discountAmount: number; promoCodeId: number }> {
    const now = new Date();
    const promo = await PromoCode.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        starts_at: { [Op.lte]: now },
        expires_at: { [Op.gte]: now },
        // Chỉ cho dùng promo không giới hạn event, hoặc đúng event của booking
        [Op.or]: [{ event_id: null }, { event_id: booking.event_id }],
      },
    });

    if (!promo) throw new AppError('Mã giảm giá không hợp lệ hoặc đã hết hạn', 400);
    if (booking.total_amount < promo.min_amount) {
      throw new AppError(`Đơn tối thiểu ${promo.min_amount.toLocaleString('vi-VN')}₫ để áp dụng mã này`, 400);
    }
    if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
      throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
    }
    // Tính thêm pending bookings đang dùng cùng promo — giảm race window checkout đồng thời
    // Exclude booking hiện tại để cho phép retry checkout trên cùng booking
    if (promo.usage_limit !== null) {
      const pendingCount = await Booking.count({
        where: { promo_code_id: promo.id, status: 'pending', id: { [Op.ne]: booking.id } },
      });
      if (promo.usage_count + pendingCount >= promo.usage_limit) {
        throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
      }
    }

    // Kiểm tra per_user_limit — cộng cả pending bookings (exclude booking hiện tại)
    const userUsage = await PromoUsage.count({ where: { promo_id: promo.id, user_id: userId } });
    const pendingUserUsage = await Booking.count({
      where: { promo_code_id: promo.id, user_id: userId, status: 'pending', id: { [Op.ne]: booking.id } },
    });
    if (userUsage + pendingUserUsage >= promo.per_user_limit) {
      throw new AppError('Bạn đã dùng hết lượt sử dụng mã này', 400);
    }

    let discountAmount: number;
    if (promo.discount_type === 'percentage') {
      discountAmount = Math.floor((booking.total_amount * Number(promo.discount_value)) / 100);
      if (promo.max_discount !== null) {
        discountAmount = Math.min(discountAmount, Number(promo.max_discount));
      }
    } else {
      discountAmount = Number(promo.discount_value);
    }

    return { discountAmount: Math.min(discountAmount, booking.total_amount), promoCodeId: promo.id };
  }
}
