import { Op } from 'sequelize';
import { Event } from '../../models/Event';
import { Zone } from '../../models/Zone';
import { Seat } from '../../models/Seat';
import { Venue } from '../../models/Venue';
import { Favorite } from '../../models/Favorite';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getIO } from '../../config/socket';
import type { ListEventsQuery } from './events.validation';

export class EventsService {
  static async list(query: ListEventsQuery, userId?: number) {
    const { search, category, status, startDate, endDate, page, limit, sort } = query;
    const offset = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (status) {
      whereClause.status = status;
    } else {
      // Mặc định chỉ hiện published + on_sale
      whereClause.status = { [Op.in]: ['published', 'on_sale', 'sold_out'] };
    }

    if (category) whereClause.category = category;

    if (search) {
      whereClause[Op.or as unknown as string] = [
        { title: { [Op.like]: `%${search}%` } },
        { short_description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (startDate) whereClause.start_time = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      whereClause.start_time = {
        ...(whereClause.start_time as object || {}),
        [Op.lte]: new Date(endDate),
      };
    }

    const orderMap: Record<string, [string, string][]> = {
      newest: [['created_at', 'DESC']],
      soonest: [['start_time', 'ASC']],
      price_asc: [['id', 'ASC']],
      price_desc: [['id', 'DESC']],
      trending: [['created_at', 'DESC']],
    };

    const { count, rows } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        { model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] },
        {
          model: Zone,
          as: 'zones',
          attributes: ['id', 'name', 'price'],
          separate: true,
          order: [['price', 'ASC']],
          limit: 1,
        },
      ],
      order: orderMap[sort] as [string, string][],
      limit,
      offset,
      distinct: true,
    });

    // Lấy danh sách yêu thích nếu user đã login
    let favoriteEventIds: Set<number> = new Set();
    if (userId) {
      const favorites = await Favorite.findAll({
        where: { user_id: userId, event_id: rows.map((e) => e.id) },
        attributes: ['event_id'],
      });
      favoriteEventIds = new Set(favorites.map((f) => f.event_id));
    }

    const data = rows.map((event) => ({
      ...event.toJSON(),
      minPrice: (() => {
        const zones = (event as unknown as { zones: { price: number }[] }).zones ?? [];
        if (!zones.length) return null;
        return Math.min(...zones.map((z) => Number(z.price)));
      })(),
      isFavorite: favoriteEventIds.has(event.id),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Helper tính minPrice từ zones array
  private static calcMinPrice(zones: { price: number }[]): number | null {
    if (!zones || zones.length === 0) return null;
    return Math.min(...zones.map((z) => Number(z.price)));
  }

  static async getFeatured() {
    const now = new Date();
    const zonesInclude = {
      model: Zone,
      as: 'zones',
      attributes: ['price'],
      separate: true,
      order: [['price', 'ASC']] as [string, string][],
      limit: 1,
    };

    const [onSaleRaw, upcomingRaw] = await Promise.all([
      Event.findAll({
        where: { status: 'on_sale' },
        include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }, zonesInclude],
        order: [['start_time', 'ASC']],
        limit: 6,
      }),
      Event.findAll({
        where: { status: 'published', sale_start_time: { [Op.gt]: now } },
        include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }, zonesInclude],
        order: [['sale_start_time', 'ASC']],
        limit: 6,
      }),
    ]);

    const addMinPrice = (events: Event[]) =>
      events.map((e) => ({
        ...e.toJSON(),
        minPrice: this.calcMinPrice((e as unknown as { zones: { price: number }[] }).zones ?? []),
      }));

    return { onSale: addMinPrice(onSaleRaw), upcoming: addMinPrice(upcomingRaw) };
  }

  static async getTrending() {
    const zonesInclude = {
      model: Zone,
      as: 'zones',
      attributes: ['price'],
      separate: true,
      order: [['price', 'ASC']] as [string, string][],
      limit: 1,
    };

    const events = await Event.findAll({
      where: { status: { [Op.in]: ['on_sale', 'sold_out'] } },
      include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }, zonesInclude],
      order: [['created_at', 'DESC']],
      limit: 8,
    });

    return events.map((e) => ({
      ...e.toJSON(),
      minPrice: this.calcMinPrice((e as unknown as { zones: { price: number }[] }).zones ?? []),
    }));
  }

  static async getSuggestions(q: string) {
    const events = await Event.findAll({
      where: {
        status: { [Op.in]: ['published', 'on_sale', 'sold_out'] },
        title: { [Op.like]: `%${q}%` },
      },
      attributes: ['id', 'title', 'slug', 'category', 'thumbnail_url', 'status'],
      limit: 8,
    });
    return events;
  }

  static async getByIdOrSlug(idOrSlug: string, userId?: number) {
    const isId = /^\d+$/.test(idOrSlug);
    const whereClause = isId ? { id: Number(idOrSlug) } : { slug: idOrSlug };

    const event = await Event.findOne({
      where: whereClause,
      include: [
        { model: Venue, as: 'venue' },
        {
          model: Zone,
          as: 'zones',
          include: [{
            model: Seat,
            as: 'seats',
            attributes: ['id', 'row_label', 'seat_number', 'status'],
          }],
          order: [['sort_order', 'ASC']],
        },
      ],
    });

    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    // Lấy trạng thái yêu thích
    let isFavorite = false;
    if (userId) {
      const fav = await Favorite.findOne({ where: { user_id: userId, event_id: event.id } });
      isFavorite = !!fav;
    }

    return { ...event.toJSON(), isFavorite };
  }

  static async getSeatMap(eventId: number) {
    const event = await Event.findByPk(eventId, {
      include: [{
        model: Zone,
        as: 'zones',
        include: [{
          model: Seat,
          as: 'seats',
          attributes: ['id', 'row_label', 'seat_number', 'status', 'locked_by'],
        }],
        order: [['sort_order', 'ASC']],
      }],
    });

    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    // Ẩn locked_by — chỉ hiện trạng thái
    const zones = ((event as unknown as { zones: Zone[] & { seats: Seat[] }[] }).zones || []).map((zone) => ({
      ...zone.toJSON(),
      seats: ((zone as unknown as { seats: Seat[] & { toJSON: () => Record<string, unknown> }[] }).seats || []).map((seat) => {
        const s = seat.toJSON() as unknown as Record<string, unknown>;
        delete s.locked_by;
        return s;
      }),
    }));

    return { eventId, zones };
  }

  static async toggleFavorite(userId: number, eventId: number) {
    const event = await Event.findByPk(eventId);
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    const existing = await Favorite.findOne({ where: { user_id: userId, event_id: eventId } });
    if (existing) {
      await existing.destroy();
      return { isFavorite: false };
    }

    await Favorite.create({ user_id: userId, event_id: eventId });
    return { isFavorite: true };
  }

  static async getUserFavorites(userId: number, page = 1, limit = 12) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        include: [{ model: Venue, as: 'venue', attributes: ['id', 'name', 'city'] }],
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows.map((f) => (f as unknown as { event: Event }).event),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  // Đăng ký nhắc nhở khi sự kiện mở bán — tạo notification scheduled
  static async remindMe(userId: number, eventId: number) {
    const event = await Event.findByPk(eventId, {
      attributes: ['id', 'title', 'slug', 'sale_start_time', 'status'],
    });
    if (!event) throw new AppError('Sự kiện không tồn tại', 404);

    if (!['draft', 'published'].includes(event.status)) {
      throw new AppError('Sự kiện đã mở bán hoặc kết thúc', 400);
    }

    // Kiểm tra đã đăng ký nhắc chưa
    const existing = await Notification.findOne({
      where: { user_id: userId, type: 'event_reminder', link: `/events/${event.slug}` },
    });
    if (existing) throw new AppError('Bạn đã đăng ký nhắc nhở cho sự kiện này', 409);

    const notification = await Notification.create({
      user_id: userId,
      type: 'event_reminder',
      title: `Sắp mở bán: ${event.title}`,
      message: `Sự kiện "${event.title}" sẽ mở bán lúc ${new Date(event.sale_start_time).toLocaleString('vi-VN')}.`,
      link: `/events/${event.slug}`,
      is_read: false,
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', notification.toJSON());
    } catch { /* optional */ }

    return { reminded: true };
  }
}
