import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: number;
  email: string;
  password_hash: string | null;
  full_name: string;
  phone: string | null;
  date_of_birth: Date | null;
  gender: 'male' | 'female' | 'other' | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
  google_id: string | null;
  email_verified: boolean;
  email_verify_token: string | null;
  login_attempts: number;
  locked_until: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'phone' | 'date_of_birth' | 'gender' | 'avatar_url' | 'google_id' | 'email_verify_token' | 'locked_until' | 'password_hash'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash: string | null;
  declare full_name: string;
  declare phone: string | null;
  declare date_of_birth: Date | null;
  declare gender: 'male' | 'female' | 'other' | null;
  declare avatar_url: string | null;
  declare role: 'customer' | 'admin';
  declare is_active: boolean;
  declare google_id: string | null;
  declare email_verified: boolean;
  declare email_verify_token: string | null;
  declare login_attempts: number;
  declare locked_until: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    google_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    email_verify_token: { type: DataTypes.STRING(255), allowNull: true },
    login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['google_id'] },
      { fields: ['role'] },
    ],
  },
);
