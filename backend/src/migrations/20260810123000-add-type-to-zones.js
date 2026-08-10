'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('zones', 'type', {
      type: Sequelize.ENUM('seated', 'standing'),
      allowNull: false,
      defaultValue: 'seated',
      after: 'event_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('zones', 'type');
  }
};
