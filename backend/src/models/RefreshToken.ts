import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RefreshTokenAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  revoked: boolean;
  device_info: string | null;
  ip_address: string | null;
  created_at?: Date;
}

type RefreshTokenCreation = Optional<RefreshTokenAttributes, 'id' | 'device_info' | 'ip_address'>;

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreation>
  implements RefreshTokenAttributes {
  declare id: number;
  declare user_id: number;
  declare token: string;
  declare expires_at: Date;
  declare revoked: boolean;
  declare device_info: string | null;
  declare ip_address: string | null;
  declare readonly created_at: Date;
}

RefreshToken.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
    device_info: { type: DataTypes.STRING(500), allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { unique: true, fields: ['token'] },
      { fields: ['expires_at'] },
    ],
  },
);
