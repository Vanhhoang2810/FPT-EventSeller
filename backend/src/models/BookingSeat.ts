import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface BookingSeatAttributes {
  id: number;
  booking_id: number;
  seat_id: number;
  price: number;
}

type BookingSeatCreation = Optional<BookingSeatAttributes, 'id'>;

export class BookingSeat extends Model<BookingSeatAttributes, BookingSeatCreation>
  implements BookingSeatAttributes {
  declare id: number;
  declare booking_id: number;
  declare seat_id: number;
  declare price: number;
}

BookingSeat.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    seat_id: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
  },
  {
    sequelize,
    tableName: 'booking_seats',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['booking_id', 'seat_id'] },
      { fields: ['seat_id'] },
    ],
  },
);
