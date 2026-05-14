import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type PaymentMethod = 'simulated' | 'vnpay' | 'momo';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentAttributes {
  id: number;
  booking_id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id: string | null;
  paid_at: Date | null;
  created_at?: Date;
}

type PaymentCreation = Optional<PaymentAttributes, 'id' | 'transaction_id' | 'paid_at'>;

export class Payment extends Model<PaymentAttributes, PaymentCreation> implements PaymentAttributes {
  declare id: number;
  declare booking_id: number;
  declare amount: number;
  declare method: PaymentMethod;
  declare status: PaymentStatus;
  declare transaction_id: string | null;
  declare paid_at: Date | null;
  declare readonly created_at: Date;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 0), allowNull: false },
    method: { type: DataTypes.ENUM('simulated', 'vnpay', 'momo'), defaultValue: 'simulated' },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
    transaction_id: { type: DataTypes.STRING(100), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'payments',
    updatedAt: false,
    indexes: [
      { fields: ['booking_id'] },
      { fields: ['status'] },
      { fields: ['transaction_id'] },
    ],
  },
);
