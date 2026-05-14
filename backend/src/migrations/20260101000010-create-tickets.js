'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      booking_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'bookings', key: 'id' } },
      seat_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'seats', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      event_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'events', key: 'id' } },
      qr_code: { type: Sequelize.STRING(500), allowNull: false, unique: true },
      status: { type: Sequelize.ENUM('active', 'used', 'cancelled'), defaultValue: 'active' },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('tickets', ['user_id']);
    await queryInterface.addIndex('tickets', ['event_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tickets');
  },
};
