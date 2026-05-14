import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'refunded';

export interface BookingAttributes {
  id: number;
  user_id: number;
  event_id: number;
  status: BookingStatus;
  total_amount: number;
  seat_count: number;
  expires_at: Date;
  promo_code_id: number | null;
  discount_amount: number;
  confirmed_at: Date | null;
  cancellation_requested: boolean;
  cancellation_reason: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type BookingCreation = Optional<BookingAttributes, 'id' | 'promo_code_id' | 'confirmed_at' | 'cancellation_requested' | 'cancellation_reason'>;

export class Booking extends Model<BookingAttributes, BookingCreation> implements BookingAttributes {
  declare id: number;
  declare user_id: number;
  declare event_id: number;
  declare status: BookingStatus;
  declare total_amount: number;
  declare seat_count: number;
  declare expires_at: Date;
  declare promo_code_id: number | null;
  declare discount_amount: number;
  declare confirmed_at: Date | null;
  declare cancellation_requested: boolean;
  declare cancellation_reason: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'expired', 'refunded'),
      defaultValue: 'pending',
    },
    total_amount: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    seat_count: { type: DataTypes.INTEGER, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    promo_code_id: { type: DataTypes.INTEGER, allowNull: true },
    discount_amount: { type: DataTypes.DECIMAL(12, 0), defaultValue: 0 },
    confirmed_at: { type: DataTypes.DATE, allowNull: true },
    cancellation_requested: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    cancellation_reason: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    tableName: 'bookings',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['event_id'] },
      { fields: ['status'] },
      { fields: ['expires_at'] },
    ],
  },
);
