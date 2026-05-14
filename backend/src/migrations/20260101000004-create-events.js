'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(250), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      short_description: { type: Sequelize.STRING(500), allowNull: true },
      banner_url: { type: Sequelize.STRING(500), allowNull: true },
      thumbnail_url: { type: Sequelize.STRING(500), allowNull: true },
      category: { type: Sequelize.ENUM('music', 'sports', 'theater', 'comedy', 'festival', 'conference', 'other'), allowNull: false },
      venue_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'venues', key: 'id' } },
      start_time: { type: Sequelize.DATE, allowNull: false },
      end_time: { type: Sequelize.DATE, allowNull: false },
      sale_start_time: { type: Sequelize.DATE, allowNull: false },
      sale_end_time: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'published', 'on_sale', 'sold_out', 'completed', 'cancelled'), defaultValue: 'draft' },
      max_tickets_per_user: { type: Sequelize.INTEGER, defaultValue: 5 },
      queue_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      queue_batch_size: { type: Sequelize.INTEGER, defaultValue: 50 },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('events', ['status']);
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['sale_start_time']);
    await queryInterface.addIndex('events', ['venue_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
  },
};
