import { Notification } from '../../models/Notification';
import { getIO } from '../../config/socket';
import type { NotificationType } from '../../models/Notification';
import { logger } from '../../utils/logger';

export class NotificationsService {
  static async getNotifications(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return {
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return Notification.count({ where: { user_id: userId, is_read: false } });
  }

  static async markRead(notificationId: number, userId: number) {
    await Notification.update(
      { is_read: true },
      { where: { id: notificationId, user_id: userId } },
    );
  }

  static async markAllRead(userId: number) {
    await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
  }

  static async createAndPush(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      is_read: false,
      link: link || null,
    });

    // Push qua WebSocket
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', notification.toJSON());
    } catch { /* WebSocket optional */ }

    return notification;
  }
}
