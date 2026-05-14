import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { Event, EventCategory, EventStatus } from '../../models/Event';
import { Zone } from '../../models/Zone';
import { Seat } from '../../models/Seat';
import { Venue } from '../../models/Venue';
import { User } from '../../models/User';
import { Booking } from '../../models/Booking';
import { BookingSeat } from '../../models/BookingSeat';
import { Ticket } from '../../models/Ticket';
import { Payment } from '../../models/Payment';
import { AuditLog } from '../../models/AuditLog';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getIO, broadcastAdminActivity } from '../../config/socket';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export class AdminService {
  // Dashboard stats
  static async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRevenue, todayRevenue, totalUsers, totalBookings, activeEvents] = await Promise.all([
      Payment.sum('amount', { where: { status: 'completed' } }) || 0,
      Payment.sum('amount', { where: { status: 'completed', paid_at: { [Op.gte]: today } } }) || 0,
      User.count({ where: { role: 'customer' } }),
      Booking.count({ where: { status: 'confirmed' } }),
      Event.count({ where: { status: { [Op.in]: ['published', 'on_sale'] } } }),
    ]);

    return { totalRevenue, todayRevenue, totalUsers, totalBookings, activeEvents };
  }

  // Events list (admin — all statuses)
  static async getEvents(page = 1, limit = 20, search?: string, status?: string) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return { data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  // Create event
  static async createEvent(adminId: number, data: {
    title: string; description?: string; shortDescription?: string;
    bannerUrl?: string; thumbnailUrl?: string; category: EventCategory;
    venueId: number; startTime: Date; endTime: Date;
    saleStartTime: Date; saleEndTime?: Date; maxTicketsPerUser?: number;
    queueEnabled?: boolean;
  }) {
    const slug = await this.generateUniqueSlug(data.title);

    const event = await Event.create({
      title: data.title,
      slug,
      description: data.description || null,
      short_description: data.shortDescription || null,
      banner_url: data.bannerUrl || null,
      thumbnail_url: data.thumbnailUrl || null,
      category: data.category,
      venue_id: data.venueId,
      start_time: data.startTime,
      end_time: data.endTime,
      sale_start_time: data.saleStartTime,
      sale_end_time: data.saleEndTime || null,
      status: 'draft',
      max_tickets_per_user: data.maxTicketsPerUser || 5,
      queue_enabled: data.queueEnabled || false,
      queue_batch_size: 50,
      created_by: adminId,
    });

    await AuditLog.create({
      admin_id: adminId,
      action: 'create_event',
      entity_type: 'event',
      entity_id: event.id,
      details: { title: event.title },
    });
    broadcastAdminActivity({ type: 'create_event', entityType: 'event', entityId: event.id, description: `Tạo sự kiện: ${event.title}` });

    return event;
  }

  // Update event
  static async updateEvent(adminId: number, eventId: number, data: Partial<{
    title: string; description: string; shortDescription: string;
    bannerUrl: string; thumbnailUrl: string; category: EventCategory;
    venueId: number; startTime: Date; endTime: Date;
    saleStartTime: Date; saleEndTime: Date; maxTicketsPerUser: number;
    queueEnabled: boolean;
  }>) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    const updateData: Partial<Event['_attributes']> = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = await this.generateUniqueSlug(data.title, eventId);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.short_description = data.shortDescription;
    if (data.bannerUrl !== undefined) updateData.banner_url = data.bannerUrl;
    if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.venueId !== undefined) updateData.venue_id = data.venueId;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.saleStartTime !== undefined) updateData.sale_start_time = data.saleStartTime;
    if (data.saleEndTime !== undefined) updateData.sale_end_time = data.saleEndTime;
    if (data.maxTicketsPerUser !== undefined) updateData.max_tickets_per_user = data.maxTicketsPerUser;
    if (data.queueEnabled !== undefined) updateData.queue_enabled = data.queueEnabled;

    await event.update(updateData);

    await AuditLog.create({
      admin_id: adminId,
      action: 'update_event',
      entity_type: 'event',
      entity_id: event.id,
      details: data as Record<string, unknown>,
    });
    broadcastAdminActivity({ type: 'update_event', entityType: 'event', entityId: event.id, description: `Cập nhật sự kiện: ${event.title}` });

    return event;
  }

  // Transition hợp lệ giữa các trạng thái sự kiện
  private static readonly ALLOWED_STATUS_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
    draft:       ['published', 'cancelled'],
    published:   ['on_sale', 'cancelled'],
    on_sale:     ['sold_out', 'completed', 'cancelled'],
    sold_out:    ['on_sale', 'completed', 'cancelled'],
    completed:   [],
    cancelled:   [],
  };

  // Update event status — H3 fix: kiểm tra transition hợp lệ
  static async updateEventStatus(adminId: number, eventId: number, status: EventStatus) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    const allowed = this.ALLOWED_STATUS_TRANSITIONS[event.status] ?? [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Không thể chuyển trạng thái từ "${event.status}" sang "${status}"`, 400,
      );
    }

    await event.update({ status });

    // Broadcast nếu cancelled
    if (status === 'cancelled') {
      try {
        const io = getIO();
        io.to(`event:${eventId}`).emit('event:cancelled', { eventId });
      } catch { /* optional */ }
    }

    await AuditLog.create({
      admin_id: adminId,
      action: 'update_event_status',
      entity_type: 'event',
      entity_id: event.id,
      details: { status },
    });
    broadcastAdminActivity({ type: 'update_event_status', entityType: 'event', entityId: event.id, description: `Đổi trạng thái sự kiện #${event.id} → ${status}` });

    return event;
  }

  // Setup zones for event (bulk)
  static async setupZones(adminId: number, eventId: number, zones: Array<{
    name: string; price: number; colorCode: string; rowsCount: number; seatsPerRow: number; sortOrder?: number;
  }>) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    const t = await sequelize.transaction();
    try {
      // Xóa zones + seats cũ nếu chưa có booking — đọc trong transaction để giảm race window
      const existingBookings = await Booking.count({ where: { event_id: eventId, status: { [Op.in]: ['pending', 'confirmed'] } }, transaction: t });
      if (existingBookings > 0) {
        // Không rollback manual — để outer catch xử lý để tránh double-rollback
        throw new AppError('Không thể cấu hình lại ghế khi đã có đơn đặt vé', 409);
      }

      // Validate trước khi ghi DB — tránh rollback lãng phí
      const overLimit = zones.find((z) => z.rowsCount > 26);
      if (overLimit) throw new AppError(`Khu "${overLimit.name}": tối đa 26 hàng (A-Z)`, 400);

      await Zone.destroy({ where: { event_id: eventId }, transaction: t });

      const createdZones = await Zone.bulkCreate(
        zones.map((z, i) => ({
          event_id: eventId,
          name: z.name,
          price: z.price,
          color_code: z.colorCode,
          rows_count: z.rowsCount,
          seats_per_row: z.seatsPerRow,
          sort_order: z.sortOrder ?? i,
        })),
        { transaction: t },
      );

      // Tạo ghế tự động
      const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const allSeats: Array<{ zone_id: number; row_label: string; seat_number: number; status: 'available' }> = [];

      for (let idx = 0; idx < createdZones.length; idx++) {
        const zone = createdZones[idx];
        const zoneData = zones[idx]; // bulkCreate giữ nguyên thứ tự input — tìm theo index tránh bug khi trùng tên
        for (let r = 0; r < zoneData.rowsCount; r++) {
          for (let s = 1; s <= zoneData.seatsPerRow; s++) {
            allSeats.push({
              zone_id: zone.id,
              row_label: rowLabels[r] || String.fromCharCode(65 + r),
              seat_number: s,
              status: 'available',
            });
          }
        }
      }

      const BATCH = 500;
      for (let i = 0; i < allSeats.length; i += BATCH) {
        await Seat.bulkCreate(allSeats.slice(i, i + BATCH), { transaction: t });
      }

      await t.commit();

      await AuditLog.create({
        admin_id: adminId,
        action: 'setup_zones',
        entity_type: 'event',
        entity_id: eventId,
        details: { zoneCount: zones.length, totalSeats: allSeats.length },
      });

      return { zones: createdZones, totalSeats: allSeats.length };
    } catch (err) {
      await t.rollback().catch(() => {});
      throw err;
    }
  }

  // Venues CRUD
  static async getVenues() {
    return Venue.findAll({ order: [['name', 'ASC']] });
  }

  static async createVenue(data: { name: string; address: string; city?: string; capacity: number; imageUrl?: string }) {
    return Venue.create({
      name: data.name,
      address: data.address,
      city: data.city || null,
      capacity: data.capacity,
      image_url: data.imageUrl || null,
    });
  }

  static async updateVenue(venueId: number, data: Partial<{ name: string; address: string; city: string; capacity: number; imageUrl: string }>) {
    const venue = await Venue.findByPk(venueId);
    if (!venue) throw new AppError('Địa điểm không tồn tại', 404);
    await venue.update({
      ...(data.name && { name: data.name }),
      ...(data.address && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.capacity && { capacity: data.capacity }),
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
    });
    return venue;
  }

  // Delete event — chỉ được khi chưa có booking confirmed
  static async deleteEvent(adminId: number, eventId: number) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    const confirmedBookings = await Booking.count({
      where: { event_id: eventId, status: { [Op.in]: ['pending', 'confirmed'] } },
    });
    if (confirmedBookings > 0) {
      throw new AppError('Không thể xóa sự kiện đã có đơn đặt vé. Hãy hủy sự kiện thay vì xóa.', 409);
    }

    await event.destroy();
    await AuditLog.create({
      admin_id: adminId, action: 'delete_event', entity_type: 'event', entity_id: eventId,
      details: { title: event.title },
    });
  }

  // Refund booking — chuyển confirmed → refunded + giải phóng ghế
  static async refundBooking(adminId: number, bookingId: number) {
    const booking = await Booking.findOne({
      where: { id: bookingId, status: 'confirmed' },
      include: [{ model: BookingSeat, as: 'bookingSeats' }],
    });
    if (!booking) throw new AppError('Không tìm thấy đơn đã xác nhận', 404);

    const t = await sequelize.transaction();
    try {
      const bookingSeats = await BookingSeat.findAll({ where: { booking_id: bookingId }, transaction: t });
      const seatIds = bookingSeats.map((bs) => bs.seat_id);

      await Seat.update({ status: 'available', locked_by: null, locked_at: null }, {
        where: { id: seatIds, status: 'sold' },
        transaction: t,
      });

      // Dùng Booking.update với WHERE status='confirmed' thay vì instance.update
      // để tránh race condition khi booking đã đổi status giữa fetch và update
      const [affected] = await Booking.update({ status: 'refunded' }, {
        where: { id: bookingId, status: 'confirmed' },
        transaction: t,
      });
      if (affected === 0) {
        throw new AppError('Đơn đặt vé không còn ở trạng thái đã xác nhận', 409);
      }

      await Payment.update({ status: 'refunded' }, {
        where: { booking_id: bookingId },
        transaction: t,
      });

      await Ticket.update({ status: 'cancelled' }, {
        where: { booking_id: bookingId },
        transaction: t,
      });

      // AuditLog trong transaction — nếu fail thì rollback cùng với refund
      await AuditLog.create({
        admin_id: adminId, action: 'refund_booking', entity_type: 'booking', entity_id: bookingId,
        details: { amount: booking.total_amount },
      }, { transaction: t });

      await t.commit();

      broadcastAdminActivity({ type: 'refund_booking', entityType: 'booking', entityId: bookingId, description: `Hoàn tiền đơn #${bookingId}` });

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

  static async deleteVenue(venueId: number) {
    const venue = await Venue.findByPk(venueId);
    if (!venue) throw new AppError('Địa điểm không tồn tại', 404);
    // Chỉ xóa khi không có event đang dùng
    const eventCount = await Event.count({ where: { venue_id: venueId, status: { [Op.notIn]: ['cancelled'] } } });
    if (eventCount > 0) throw new AppError('Không thể xóa địa điểm đang có sự kiện', 409);
    await venue.destroy();
  }

  // Users management
  static async getUsers(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) where[Op.or as unknown as string] = [
      { email: { [Op.like]: `%${search}%` } },
      { full_name: { [Op.like]: `%${search}%` } },
    ];

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'email_verify_token'] },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  static async toggleBanUser(adminId: number, userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);
    if (user.role === 'admin') throw new AppError('Không thể ban tài khoản admin', 403);

    const newIsActive = !user.is_active;
    await user.update({ is_active: newIsActive });
    // newIsActive=true → vừa unban; newIsActive=false → vừa ban
    await AuditLog.create({
      admin_id: adminId,
      action: newIsActive ? 'unban_user' : 'ban_user',
      entity_type: 'user',
      entity_id: userId,
    });
    broadcastAdminActivity({ type: newIsActive ? 'unban_user' : 'ban_user', entityType: 'user', entityId: userId, description: `${newIsActive ? 'Unban' : 'Ban'} user: ${user.email}` });

    return user;
  }

  // Bookings management
  static async getBookings(
    page = 1,
    limit = 20,
    status?: string,
    eventId?: number,
    search?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    // Filter đặc biệt: yêu cầu hủy
    if (status === 'cancel_requested') {
      where.cancellation_requested = true;
    } else if (status) {
      where.status = status;
    }
    if (eventId) where.event_id = eventId;
    if (startDate && endDate) where.created_at = { [Op.between]: [startDate, endDate] };
    else if (startDate) where.created_at = { [Op.gte]: startDate };
    else if (endDate) where.created_at = { [Op.lte]: endDate };

    const userWhere = search
      ? { [Op.or]: [{ email: { [Op.like]: `%${search}%` } }, { full_name: { [Op.like]: `%${search}%` } }] }
      : undefined;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'full_name'], ...(userWhere && { where: userWhere, required: true }) },
        { model: Event, as: 'event', attributes: ['id', 'title', 'slug'] },
        { model: Payment, as: 'payment' },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return { data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  // ─── Chart APIs ───────────────────────────────────────────────

  static async getRevenueChart(period: 'hour' | 'day' | 'month' | 'year' = 'day') {
    type Row = { label: string; revenue: number; bookings: number };

    if (period === 'hour') {
      // 24 giờ gần nhất
      const rows = await sequelize.query<Row>(
        `SELECT DATE_FORMAT(paid_at, '%Y-%m-%d %H:00') as label,
                SUM(amount) as revenue, COUNT(*) as bookings
         FROM payments
         WHERE status = 'completed' AND paid_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         GROUP BY DATE_FORMAT(paid_at, '%Y-%m-%d %H:00')
         ORDER BY label`,
        { type: QueryTypes.SELECT },
      );
      // Điền 24 giờ trống
      const result: Row[] = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date(Date.now() - i * 3600000);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
        const found = rows.find((r) => r.label === label);
        result.push({ label, revenue: Number(found?.revenue ?? 0), bookings: Number(found?.bookings ?? 0) });
      }
      return result;
    }

    if (period === 'month') {
      // 12 tháng gần nhất
      const rows = await sequelize.query<Row>(
        `SELECT DATE_FORMAT(paid_at, '%Y-%m') as label,
                SUM(amount) as revenue, COUNT(*) as bookings
         FROM payments
         WHERE status = 'completed' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
         ORDER BY label`,
        { type: QueryTypes.SELECT },
      );
      const result: Row[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const found = rows.find((r) => r.label === label);
        result.push({ label, revenue: Number(found?.revenue ?? 0), bookings: Number(found?.bookings ?? 0) });
      }
      return result;
    }

    if (period === 'year') {
      // Tất cả các năm có dữ liệu
      const rows = await sequelize.query<Row>(
        `SELECT YEAR(paid_at) as label,
                SUM(amount) as revenue, COUNT(*) as bookings
         FROM payments
         WHERE status = 'completed'
         GROUP BY YEAR(paid_at)
         ORDER BY label`,
        { type: QueryTypes.SELECT },
      );
      return rows.map((r) => ({ ...r, revenue: Number(r.revenue), bookings: Number(r.bookings) }));
    }

    // day (default): 30 ngày gần nhất
    const days = 30;
    const rows = await sequelize.query<Row>(
      `SELECT DATE(paid_at) as label,
              SUM(amount) as revenue, COUNT(*) as bookings
       FROM payments
       WHERE status = 'completed' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
       GROUP BY DATE(paid_at)
       ORDER BY label`,
      { replacements: { days }, type: QueryTypes.SELECT },
    );
    const result: Row[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      const found = rows.find((r) => r.label === label);
      result.push({ label, revenue: Number(found?.revenue ?? 0), bookings: Number(found?.bookings ?? 0) });
    }
    return result;
  }

  // Tỷ lệ lấp đầy ghế theo event đang hoạt động
  static async getSeatFillStats() {
    const rows = await sequelize.query<{ event_id: number; title: string; total: number; sold: number }>(
      `SELECT e.id as event_id, e.title,
              COUNT(s.id) as total,
              SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END) as sold
       FROM events e
       JOIN zones z ON z.event_id = e.id
       JOIN seats s ON s.zone_id = z.id
       WHERE e.status IN ('on_sale', 'sold_out', 'completed')
       GROUP BY e.id, e.title
       ORDER BY sold DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT },
    );
    return rows.map((r) => ({
      eventId: r.event_id,
      title: r.title,
      total: Number(r.total),
      sold: Number(r.sold),
      fillRate: r.total > 0 ? Math.round((Number(r.sold) / Number(r.total)) * 100) : 0,
    }));
  }

  // Thống kê nhân khẩu học: giới tính + nhóm tuổi của khán giả
  static async getDemographics() {
    const [genderRows, ageRows] = await Promise.all([
      sequelize.query<{ gender: string | null; count: number }>(
        `SELECT gender, COUNT(*) as count
         FROM users
         WHERE role = 'customer'
         GROUP BY gender`,
        { type: QueryTypes.SELECT },
      ),
      sequelize.query<{ age_group: string; count: number }>(
        `SELECT
           CASE
             WHEN date_of_birth IS NULL                                        THEN 'unknown'
             WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18          THEN 'under18'
             WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 24 THEN '18_24'
             WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 25 AND 34 THEN '25_34'
             WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 35 AND 44 THEN '35_44'
             ELSE '45plus'
           END AS age_group,
           COUNT(*) AS count
         FROM users
         WHERE role = 'customer'
         GROUP BY age_group`,
        { type: QueryTypes.SELECT },
      ),
    ]);

    const GENDER_ORDER = ['male', 'female', 'other', null];
    const AGE_ORDER = ['under18', '18_24', '25_34', '35_44', '45plus', 'unknown'];

    const gender = GENDER_ORDER
      .map((g) => {
        const row = genderRows.find((r) => r.gender === g);
        return { name: g ?? 'other', value: Number(row?.count ?? 0) };
      })
      .filter((g) => g.value > 0);

    const ageGroups = AGE_ORDER
      .map((ag) => {
        const row = ageRows.find((r) => r.age_group === ag);
        return { name: ag, value: Number(row?.count ?? 0) };
      })
      .filter((ag) => ag.value > 0);

    return { gender, ageGroups };
  }

  // Conversion funnel
  static async getConversionFunnel() {
    const [totalAttempts, confirmed, expired, cancelled, refunded, totalRevenue] = await Promise.all([
      Booking.count(),
      Booking.count({ where: { status: 'confirmed' } }),
      Booking.count({ where: { status: 'expired' } }),
      Booking.count({ where: { status: 'cancelled' } }),
      Booking.count({ where: { status: 'refunded' } }),
      Payment.sum('amount', { where: { status: 'completed' } }) || 0,
    ]);
    const pending = totalAttempts - confirmed - expired - cancelled - refunded;
    return [
      { stage: 'Chọn ghế', value: totalAttempts },
      { stage: 'Thanh toán', value: confirmed + pending },
      { stage: 'Xác nhận', value: confirmed },
      { stage: 'Doanh thu', value: Number(totalRevenue) },
    ];
  }

  // Đỉnh cao đặt vé theo giờ trong ngày
  static async getPeakHours() {
    const rows = await sequelize.query<{ hour: number; count: number }>(
      `SELECT HOUR(created_at) as hour, COUNT(*) as count
       FROM bookings
       WHERE status = 'confirmed'
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      { type: QueryTypes.SELECT },
    );
    // Điền 24 giờ
    return Array.from({ length: 24 }, (_, h) => {
      const found = rows.find((r) => Number(r.hour) === h);
      return { hour: h, count: Number(found?.count ?? 0) };
    });
  }

  // Audit logs
  static async getAuditLogs(page = 1, limit = 20, search?: string, action?: string) {
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (action && action !== 'all') where.action = action;
    // Search trên entity_type (không ghi đè action filter)
    if (search) where.entity_type = { [Op.like]: `%${search}%` };
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'admin', attributes: ['id', 'email', 'full_name'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });
    return { data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  // Chi tiết user + lịch sử booking
  static async getUserDetail(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'email_verify_token'] },
    });
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'slug', 'start_time'] },
        { model: Payment, as: 'payment' },
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    // Dùng query riêng để tránh stats bị cắt bởi limit: 20
    const confirmedBookingIds = await Booking.findAll({
      where: { user_id: userId, status: 'confirmed' },
      attributes: ['id'],
    });
    const ids = confirmedBookingIds.map((b) => b.id);
    const [totalBookings, confirmedBookings, totalSpentRaw] = await Promise.all([
      Booking.count({ where: { user_id: userId } }),
      Promise.resolve(ids.length),
      ids.length > 0
        ? Payment.sum('amount', { where: { booking_id: ids, status: 'completed' } })
        : Promise.resolve(0),
    ]);
    const stats = { totalBookings, confirmedBookings, totalSpent: Number(totalSpentRaw) || 0 };

    return { user, bookings, stats };
  }

  // Dữ liệu export báo cáo
  static async getReportData(startDate: Date, endDate: Date) {
    const bookings = await Booking.findAll({
      where: {
        status: 'confirmed',
        created_at: { [Op.between]: [startDate, endDate] },
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'full_name'] },
        { model: Event, as: 'event', attributes: ['id', 'title', 'category'] },
        { model: Payment, as: 'payment' },
      ],
      order: [['created_at', 'DESC']],
    });

    // Dùng payment.amount (số tiền thực thu sau discount) thay vì total_amount (trước discount)
    const totalRevenue = bookings.reduce((s, b) => {
      const p = (b as unknown as { payment?: { amount: number } }).payment;
      return s + Number(p?.amount ?? (Number(b.total_amount) - Number(b.discount_amount)));
    }, 0);
    return { bookings, totalRevenue, count: bookings.length };
  }

  private static async generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let counter = 1;

    while (true) {
      const where: Record<string, unknown> = { slug };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const existing = await Event.findOne({ where });
      if (!existing) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }
}
