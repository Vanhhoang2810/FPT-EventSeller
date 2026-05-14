import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type EventCategory = 'music' | 'sports' | 'theater' | 'comedy' | 'festival' | 'conference' | 'other';
export type EventStatus = 'draft' | 'published' | 'on_sale' | 'sold_out' | 'completed' | 'cancelled';

export interface EventAttributes {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  category: EventCategory;
  venue_id: number;
  start_time: Date;
  end_time: Date;
  sale_start_time: Date;
  sale_end_time: Date | null;
  status: EventStatus;
  max_tickets_per_user: number;
  queue_enabled: boolean;
  queue_batch_size: number;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

type EventCreation = Optional<EventAttributes, 'id' | 'description' | 'short_description' | 'banner_url' | 'thumbnail_url' | 'sale_end_time'>;

export class Event extends Model<EventAttributes, EventCreation> implements EventAttributes {
  declare id: number;
  declare title: string;
  declare slug: string;
  declare description: string | null;
  declare short_description: string | null;
  declare banner_url: string | null;
  declare thumbnail_url: string | null;
  declare category: EventCategory;
  declare venue_id: number;
  declare start_time: Date;
  declare end_time: Date;
  declare sale_start_time: Date;
  declare sale_end_time: Date | null;
  declare status: EventStatus;
  declare max_tickets_per_user: number;
  declare queue_enabled: boolean;
  declare queue_batch_size: number;
  declare created_by: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Event.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(250), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    short_description: { type: DataTypes.STRING(500), allowNull: true },
    banner_url: { type: DataTypes.STRING(500), allowNull: true },
    thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
    category: {
      type: DataTypes.ENUM('music', 'sports', 'theater', 'comedy', 'festival', 'conference', 'other'),
      allowNull: false,
    },
    venue_id: { type: DataTypes.INTEGER, allowNull: false },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    sale_start_time: { type: DataTypes.DATE, allowNull: false },
    sale_end_time: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'on_sale', 'sold_out', 'completed', 'cancelled'),
      defaultValue: 'draft',
    },
    max_tickets_per_user: { type: DataTypes.INTEGER, defaultValue: 5 },
    queue_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    queue_batch_size: { type: DataTypes.INTEGER, defaultValue: 50 },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'events',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['sale_start_time'] },
      { fields: ['venue_id'] },
    ],
  },
);
