'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
      max_discount: { type: Sequelize.DECIMAL(12, 0), allowNull: true },
      event_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'events', key: 'id' } },
      usage_limit: { type: Sequelize.INTEGER, allowNull: true },
      usage_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      per_user_limit: { type: Sequelize.INTEGER, defaultValue: 1 },
      min_amount: { type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('promo_codes', ['event_id']);
    await queryInterface.addIndex('promo_codes', ['is_active']);
    await queryInterface.addIndex('promo_codes', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('promo_codes');
  },
};
