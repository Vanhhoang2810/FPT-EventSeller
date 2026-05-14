import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface VenueAttributes {
  id: number;
  name: string;
  address: string;
  city: string | null;
  capacity: number;
  image_url: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type VenueCreation = Optional<VenueAttributes, 'id' | 'city' | 'image_url'>;

export class Venue extends Model<VenueAttributes, VenueCreation> implements VenueAttributes {
  declare id: number;
  declare name: string;
  declare address: string;
  declare city: string | null;
  declare capacity: number;
  declare image_url: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Venue.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    tableName: 'venues',
  },
);
