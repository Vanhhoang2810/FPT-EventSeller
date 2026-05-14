'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      booking_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'bookings', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
      method: { type: Sequelize.ENUM('simulated', 'vnpay', 'momo'), defaultValue: 'simulated' },
      status: { type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
      transaction_id: { type: Sequelize.STRING(100), allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('payments', ['booking_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['transaction_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
