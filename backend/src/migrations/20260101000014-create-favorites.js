'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('favorites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      event_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'events', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('favorites', { fields: ['user_id', 'event_id'], unique: true });
    await queryInterface.addIndex('favorites', ['event_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('favorites');
  },
};
