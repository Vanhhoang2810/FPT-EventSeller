'use strict';
const argon2 = require('argon2');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await argon2.hash('Admin@12345');
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@ticketrush.vn',
        password_hash: passwordHash,
        full_name: 'Admin TicketRush',
        role: 'admin',
        is_active: true,
        email_verified: true,
        login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'user@ticketrush.vn',
        password_hash: await argon2.hash('User@12345'),
        full_name: 'Người Dùng Demo',
        phone: '0912345678',
        role: 'customer',
        is_active: true,
        email_verified: true,
        login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: ['admin@ticketrush.vn', 'user@ticketrush.vn'] });
  },
};
