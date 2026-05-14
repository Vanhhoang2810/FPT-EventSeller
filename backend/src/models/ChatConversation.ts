import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type ChatStatus = 'open' | 'in_progress' | 'closed';

export interface ChatConversationAttributes {
  id: number;
  user_id: number | null;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  status: ChatStatus;
  assigned_to: number | null;
  last_message_at: Date | null;
  unread_admin: number;
  unread_user: number;
  deleted_by_user: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type ChatConversationCreation = Optional<ChatConversationAttributes, 'id' | 'user_id' | 'visitor_id' | 'visitor_name' | 'visitor_email' | 'assigned_to' | 'last_message_at' | 'unread_admin' | 'unread_user' | 'deleted_by_user'>;

export class ChatConversation extends Model<ChatConversationAttributes, ChatConversationCreation> implements ChatConversationAttributes {
  declare id: number;
  declare user_id: number | null;
  declare visitor_id: string | null;
  declare visitor_name: string | null;
  declare visitor_email: string | null;
  declare status: ChatStatus;
  declare assigned_to: number | null;
  declare last_message_at: Date | null;
  declare unread_admin: number;
  declare unread_user: number;
  declare deleted_by_user: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

ChatConversation.init({
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: true },
  visitor_id:     { type: DataTypes.STRING(100), allowNull: true },
  visitor_name:   { type: DataTypes.STRING(100), allowNull: true },
  visitor_email:  { type: DataTypes.STRING(255), allowNull: true },
  status:         { type: DataTypes.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
  assigned_to:    { type: DataTypes.INTEGER, allowNull: true },
  last_message_at:{ type: DataTypes.DATE, allowNull: true },
  unread_admin:    { type: DataTypes.INTEGER, defaultValue: 0 },
  unread_user:     { type: DataTypes.INTEGER, defaultValue: 0 },
  deleted_by_user: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'chat_conversations' });
