'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_usage', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      promo_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'promo_codes', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      booking_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'bookings', key: 'id' } },
      discount_amount: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('promo_usage', { fields: ['promo_id', 'user_id', 'booking_id'], unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('promo_usage');
  },
};
