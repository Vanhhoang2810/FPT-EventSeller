import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_expired'
  | 'event_reminder'
  | 'event_cancelled'
  | 'queue_granted'
  | 'system';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at?: Date;
}

type NotificationCreation = Optional<NotificationAttributes, 'id' | 'link'>;

export class Notification extends Model<NotificationAttributes, NotificationCreation>
  implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare type: NotificationType;
  declare title: string;
  declare message: string;
  declare link: string | null;
  declare is_read: boolean;
  declare readonly created_at: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'booking_confirmed', 'booking_expired', 'event_reminder',
        'event_cancelled', 'queue_granted', 'system',
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING(500), allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'notifications',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  },
);
