import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type DiscountType = 'percentage' | 'fixed';

export interface PromoCodeAttributes {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  event_id: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  min_amount: number;
  starts_at: Date;
  expires_at: Date;
  is_active: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

type PromoCodeCreation = Optional<PromoCodeAttributes, 'id' | 'max_discount' | 'event_id' | 'usage_limit'>;

export class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreation>
  implements PromoCodeAttributes {
  declare id: number;
  declare code: string;
  declare discount_type: DiscountType;
  declare discount_value: number;
  declare max_discount: number | null;
  declare event_id: number | null;
  declare usage_limit: number | null;
  declare usage_count: number;
  declare per_user_limit: number;
  declare min_amount: number;
  declare starts_at: Date;
  declare expires_at: Date;
  declare is_active: boolean;
  declare created_by: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PromoCode.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount_type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
    discount_value: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    max_discount: { type: DataTypes.DECIMAL(12, 0), allowNull: true },
    event_id: { type: DataTypes.INTEGER, allowNull: true },
    usage_limit: { type: DataTypes.INTEGER, allowNull: true },
    usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    per_user_limit: { type: DataTypes.INTEGER, defaultValue: 1 },
    min_amount: { type: DataTypes.DECIMAL(12, 0), defaultValue: 0 },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'promo_codes',
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['event_id'] },
      { fields: ['is_active'] },
      { fields: ['expires_at'] },
    ],
  },
);
