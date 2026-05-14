'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_conversations', {
      id:            { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id:       { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      visitor_id:    { type: Sequelize.STRING(100), allowNull: true },
      visitor_name:  { type: Sequelize.STRING(100), allowNull: true },
      visitor_email: { type: Sequelize.STRING(255), allowNull: true },
      status:        { type: Sequelize.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
      assigned_to:   { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      last_message_at: { type: Sequelize.DATE, allowNull: true },
      unread_admin:  { type: Sequelize.INTEGER, defaultValue: 0 },
      unread_user:   { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('chat_conversations', ['status']);
    await queryInterface.addIndex('chat_conversations', ['user_id']);
    await queryInterface.addIndex('chat_conversations', ['visitor_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('chat_conversations');
  },
};
