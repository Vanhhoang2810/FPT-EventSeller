'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Zones cho Event 1 (Nhà hát Lớn — 598 chỗ)
    await queryInterface.bulkInsert('zones', [
      { event_id: 1, name: 'VIP', price: 800000, color_code: '#059669', rows_count: 3, seats_per_row: 15, sort_order: 0, created_at: now, updated_at: now },
      { event_id: 1, name: 'Hạng A', price: 500000, color_code: '#3B82F6', rows_count: 5, seats_per_row: 20, sort_order: 1, created_at: now, updated_at: now },
      { event_id: 1, name: 'Hạng B', price: 300000, color_code: '#8B5CF6', rows_count: 8, seats_per_row: 20, sort_order: 2, created_at: now, updated_at: now },

      // Zones cho Event 3 (Hài kịch — Nhà hát Hòa Bình)
      { event_id: 3, name: 'Hạng Vàng', price: 600000, color_code: '#F59E0B', rows_count: 4, seats_per_row: 15, sort_order: 0, created_at: now, updated_at: now },
      { event_id: 3, name: 'Hạng Bạc', price: 350000, color_code: '#6B7280', rows_count: 6, seats_per_row: 20, sort_order: 1, created_at: now, updated_at: now },

      // Zones cho Event 4 (Vũ Cát Tường — GEM Center)
      { event_id: 4, name: 'VIP', price: 1200000, color_code: '#059669', rows_count: 2, seats_per_row: 20, sort_order: 0, created_at: now, updated_at: now },
      { event_id: 4, name: 'Stall', price: 700000, color_code: '#F97316', rows_count: 5, seats_per_row: 25, sort_order: 1, created_at: now, updated_at: now },
      { event_id: 4, name: 'Balcony', price: 450000, color_code: '#3B82F6', rows_count: 4, seats_per_row: 20, sort_order: 2, created_at: now, updated_at: now },
    ]);

    // Lấy zones vừa insert
    const [zones] = await queryInterface.sequelize.query('SELECT id, rows_count, seats_per_row FROM zones ORDER BY id');

    const seats = [];
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (const zone of zones) {
      for (let r = 0; r < zone.rows_count; r++) {
        const rowLabel = rowLabels[r];
        for (let s = 1; s <= zone.seats_per_row; s++) {
          seats.push({
            zone_id: zone.id,
            row_label: rowLabel,
            seat_number: s,
            status: 'available',
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // Insert theo batch để tránh quá lớn
    const batchSize = 500;
    for (let i = 0; i < seats.length; i += batchSize) {
      await queryInterface.bulkInsert('seats', seats.slice(i, i + batchSize));
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('seats', null, {});
    await queryInterface.bulkDelete('zones', null, {});
  },
};
