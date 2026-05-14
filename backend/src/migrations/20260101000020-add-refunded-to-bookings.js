'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirmed','cancelled','expired','refunded') NOT NULL DEFAULT 'pending'"
    );
  },
  async down(queryInterface) {
    // Chuyển 'refunded' về 'cancelled' trước khi thu hẹp ENUM
    await queryInterface.sequelize.query(
      "UPDATE bookings SET status = 'cancelled' WHERE status = 'refunded'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending'"
    );
  },
};
