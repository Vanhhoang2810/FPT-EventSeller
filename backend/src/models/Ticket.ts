import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type TicketStatus = 'active' | 'used' | 'cancelled';

export interface TicketAttributes {
  id: number;
  booking_id: number;
  seat_id: number;
  user_id: number;
  event_id: number;
  qr_code: string;
  status: TicketStatus;
  used_at: Date | null;
  created_at?: Date;
}

type TicketCreation = Optional<TicketAttributes, 'id' | 'used_at'>;

export class Ticket extends Model<TicketAttributes, TicketCreation> implements TicketAttributes {
  declare id: number;
  declare booking_id: number;
  declare seat_id: number;
  declare user_id: number;
  declare event_id: number;
  declare qr_code: string;
  declare status: TicketStatus;
  declare used_at: Date | null;
  declare readonly created_at: Date;
}

Ticket.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    seat_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    qr_code: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('active', 'used', 'cancelled'), defaultValue: 'active' },
    used_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'tickets',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['qr_code'] },
      { fields: ['user_id'] },
      { fields: ['event_id'] },
    ],
  },
);
