'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      event_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'events', key: 'id' } },
      status: { type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'expired'), defaultValue: 'pending' },
      total_amount: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
      seat_count: { type: Sequelize.INTEGER, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      promo_code_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'promo_codes', key: 'id' } },
      discount_amount: { type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
      confirmed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('bookings', ['user_id']);
    await queryInterface.addIndex('bookings', ['event_id']);
    await queryInterface.addIndex('bookings', ['status']);
    await queryInterface.addIndex('bookings', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
  },
};
