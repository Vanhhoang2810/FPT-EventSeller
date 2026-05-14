import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type SenderType = 'user' | 'admin' | 'visitor';

export interface ChatMessageAttributes {
  id: number;
  conversation_id: number;
  sender_type: SenderType;
  sender_id: number | null;
  sender_name: string | null;
  content: string;
  is_read: boolean;
  is_recalled: boolean;
  created_at?: Date;
}

type ChatMessageCreation = Optional<ChatMessageAttributes, 'id' | 'sender_id' | 'sender_name' | 'is_read' | 'is_recalled'>;

export class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreation> implements ChatMessageAttributes {
  declare id: number;
  declare conversation_id: number;
  declare sender_type: SenderType;
  declare sender_id: number | null;
  declare sender_name: string | null;
  declare content: string;
  declare is_read: boolean;
  declare is_recalled: boolean;
  declare readonly created_at: Date;
}

ChatMessage.init({
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_type:     { type: DataTypes.ENUM('user', 'admin', 'visitor'), allowNull: false },
  sender_id:       { type: DataTypes.INTEGER, allowNull: true },
  sender_name:     { type: DataTypes.STRING(100), allowNull: true },
  content:         { type: DataTypes.TEXT, allowNull: false },
  is_read:         { type: DataTypes.BOOLEAN, defaultValue: false },
  is_recalled:     { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'chat_messages', updatedAt: false });
