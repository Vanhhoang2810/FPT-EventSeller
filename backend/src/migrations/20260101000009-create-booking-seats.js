'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('booking_seats', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      booking_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'bookings', key: 'id' }, onDelete: 'CASCADE' },
      seat_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'seats', key: 'id' } },
      price: { type: Sequelize.DECIMAL(12, 0), allowNull: false },
    });
    await queryInterface.addIndex('booking_seats', { fields: ['booking_id', 'seat_id'], unique: true });
    await queryInterface.addIndex('booking_seats', ['seat_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_seats');
  },
};
