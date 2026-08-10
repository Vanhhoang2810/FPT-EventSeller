'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('venues', [
      {
        name: 'Nhà hát Lớn Hà Nội',
        address: '1 Tràng Tiền, Hoàn Kiếm',
        city: 'Hà Nội',
        capacity: 598,
        image_url: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'SVĐ Quốc gia Mỹ Đình',
        address: 'Nam Từ Liêm',
        city: 'Hà Nội',
        capacity: 40192,
        image_url: 'https://images.unsplash.com/photo-1540747913346-19378f52eb19?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Nhà hát Hòa Bình',
        address: '3 Tháng 2, Phường 11, Quận 10',
        city: 'TP. Hồ Chí Minh',
        capacity: 2200,
        image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'GEM Center',
        address: '8 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1',
        city: 'TP. Hồ Chí Minh',
        capacity: 2000,
        image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Lâu đài Đà Lạt',
        address: '2 Lê Lai, Phường 1',
        city: 'Đà Lạt',
        capacity: 500,
        image_url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Van Phuc City Outdoor Stage',
        address: 'Khu đô thị Van Phúc, Thuận An',
        city: 'Bình Dương',
        capacity: 5000,
        image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Cung Văn hoá Hữu nghị Hà Nội',
        address: '91 Trần Hưng Đạo, Hoàn Kiếm',
        city: 'Hà Nội',
        capacity: 1800,
        image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'GEM Center HCM',
        address: '8 Nguyễn Bỉnh Khiêm, Quận 1',
        city: 'TP. Hồ Chí Minh',
        capacity: 3000,
        image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('venues', null, {});
  },
};
