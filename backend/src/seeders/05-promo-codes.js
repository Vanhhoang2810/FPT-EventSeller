'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('promo_codes', [
      {
        code: 'WELCOME50',
        discount_type: 'fixed',
        discount_value: 50000,
        max_discount: null,
        event_id: null,
        usage_limit: 100,
        usage_count: 0,
        per_user_limit: 1,
        min_amount: 200000,
        starts_at: now,
        expires_at: future(90),
        is_active: true,
        created_by: 1,
        created_at: now,
        updated_at: now,
      },
      {
        code: 'SUMMER2026',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount: 100000,
        event_id: null,
        usage_limit: 50,
        usage_count: 0,
        per_user_limit: 1,
        min_amount: 500000,
        starts_at: now,
        expires_at: future(60),
        is_active: true,
        created_by: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('promo_codes', null, {});
  },
};
