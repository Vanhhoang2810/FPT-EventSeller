'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thu hồi tin nhắn
    await queryInterface.addColumn('chat_messages', 'is_recalled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    // Xóa cuộc hội thoại phía user (soft delete)
    await queryInterface.addColumn('chat_conversations', 'deleted_by_user', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('chat_messages', 'is_recalled');
    await queryInterface.removeColumn('chat_conversations', 'deleted_by_user');
  },
};
