import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AuditLogAttributes {
  id: number;
  admin_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at?: Date;
}

type AuditLogCreation = Optional<AuditLogAttributes, 'id' | 'entity_id' | 'details' | 'ip_address'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreation>
  implements AuditLogAttributes {
  declare id: number;
  declare admin_id: number;
  declare action: string;
  declare entity_type: string;
  declare entity_id: number | null;
  declare details: Record<string, unknown> | null;
  declare ip_address: string | null;
  declare readonly created_at: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['entity_type'] },
      { fields: ['created_at'] },
    ],
  },
);
