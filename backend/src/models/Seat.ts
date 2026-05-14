import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type SeatStatus = 'available' | 'locked' | 'sold' | 'disabled';

export interface SeatAttributes {
  id: number;
  zone_id: number;
  row_label: string;
  seat_number: number;
  status: SeatStatus;
  locked_at: Date | null;
  locked_by: number | null;
  created_at?: Date;
  updated_at?: Date;
}

type SeatCreation = Optional<SeatAttributes, 'id' | 'locked_at' | 'locked_by'>;

export class Seat extends Model<SeatAttributes, SeatCreation> implements SeatAttributes {
  declare id: number;
  declare zone_id: number;
  declare row_label: string;
  declare seat_number: number;
  declare status: SeatStatus;
  declare locked_at: Date | null;
  declare locked_by: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Seat.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    zone_id: { type: DataTypes.INTEGER, allowNull: false },
    row_label: { type: DataTypes.STRING(5), allowNull: false },
    seat_number: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('available', 'locked', 'sold', 'disabled'),
      defaultValue: 'available',
    },
    locked_at: { type: DataTypes.DATE, allowNull: true },
    locked_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'seats',
    indexes: [
      { fields: ['zone_id'] },
      { fields: ['status'] },
      { unique: true, fields: ['zone_id', 'row_label', 'seat_number'] },
      { fields: ['locked_at'] },
    ],
  },
);
