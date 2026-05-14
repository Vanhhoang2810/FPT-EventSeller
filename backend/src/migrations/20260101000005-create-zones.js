'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('zones', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'events', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(50), allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
      color_code: { type: Sequelize.STRING(7), allowNull: false },
      rows_count: { type: Sequelize.INTEGER, allowNull: false },
      seats_per_row: { type: Sequelize.INTEGER, allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('zones', ['event_id']);
    await queryInterface.addIndex('zones', { fields: ['event_id', 'name'], unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('zones');
  },
};
