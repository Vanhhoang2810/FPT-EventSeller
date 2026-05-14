'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
      id:              { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      conversation_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_conversations', key: 'id' }, onDelete: 'CASCADE' },
      sender_type:     { type: Sequelize.ENUM('user', 'admin', 'visitor'), allowNull: false },
      sender_id:       { type: Sequelize.INTEGER, allowNull: true },
      sender_name:     { type: Sequelize.STRING(100), allowNull: true },
      content:         { type: Sequelize.TEXT, allowNull: false },
      is_read:         { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('chat_messages', ['conversation_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('chat_messages');
  },
};
