'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('seats', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      zone_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'zones', key: 'id' }, onDelete: 'CASCADE' },
      row_label: { type: Sequelize.STRING(5), allowNull: false },
      seat_number: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('available', 'locked', 'sold', 'disabled'), defaultValue: 'available' },
      locked_at: { type: Sequelize.DATE, allowNull: true },
      locked_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('seats', ['zone_id']);
    await queryInterface.addIndex('seats', ['status']);
    await queryInterface.addIndex('seats', { fields: ['zone_id', 'row_label', 'seat_number'], unique: true });
    await queryInterface.addIndex('seats', ['locked_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('seats');
  },
};
