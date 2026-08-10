import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ZoneAttributes {
  id: number;
  event_id: number;
  type: 'seated' | 'standing';
  name: string;
  price: number;
  color_code: string;
  rows_count: number;
  seats_per_row: number;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

type ZoneCreation = Optional<ZoneAttributes, 'id' | 'type' | 'sort_order'>;

export class Zone extends Model<ZoneAttributes, ZoneCreation> implements ZoneAttributes {
  declare id: number;
  declare event_id: number;
  declare type: 'seated' | 'standing';
  declare name: string;
  declare price: number;
  declare color_code: string;
  declare rows_count: number;
  declare seats_per_row: number;
  declare sort_order: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Zone.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('seated', 'standing'), defaultValue: 'seated' },
    name: { type: DataTypes.STRING(50), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    color_code: { type: DataTypes.STRING(7), allowNull: false },
    rows_count: { type: DataTypes.INTEGER, allowNull: false },
    seats_per_row: { type: DataTypes.INTEGER, allowNull: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'zones',
    indexes: [
      { fields: ['event_id'] },
      { unique: true, fields: ['event_id', 'name'] },
    ],
  },
);
