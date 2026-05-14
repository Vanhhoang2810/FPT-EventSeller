import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PromoUsageAttributes {
  id: number;
  promo_id: number;
  user_id: number;
  booking_id: number;
  discount_amount: number;
  created_at?: Date;
}

type PromoUsageCreation = Optional<PromoUsageAttributes, 'id'>;

export class PromoUsage extends Model<PromoUsageAttributes, PromoUsageCreation>
  implements PromoUsageAttributes {
  declare id: number;
  declare promo_id: number;
  declare user_id: number;
  declare booking_id: number;
  declare discount_amount: number;
  declare readonly created_at: Date;
}

PromoUsage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    promo_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    discount_amount: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
  },
  {
    sequelize,
    tableName: 'promo_usage',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['promo_id', 'user_id', 'booking_id'] },
    ],
  },
);
