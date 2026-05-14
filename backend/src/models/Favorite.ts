import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FavoriteAttributes {
  id: number;
  user_id: number;
  event_id: number;
  created_at?: Date;
}

type FavoriteCreation = Optional<FavoriteAttributes, 'id'>;

export class Favorite extends Model<FavoriteAttributes, FavoriteCreation>
  implements FavoriteAttributes {
  declare id: number;
  declare user_id: number;
  declare event_id: number;
  declare readonly created_at: Date;
}

Favorite.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'favorites',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['user_id', 'event_id'] },
      { fields: ['event_id'] },
    ],
  },
);
