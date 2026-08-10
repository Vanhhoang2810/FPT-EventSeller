import { sequelize } from './src/config/database';
import { Zone } from './src/models/Zone';
import { Seat } from './src/models/Seat';

const newZones = [
  // Event 2
  { event_id: 2, name: 'SVIP',    price: 1500000, color_code: '#F59E0B', rows_count: 2, seats_per_row: 20, sort_order: 0 },
  { event_id: 2, name: 'VIP',     price: 900000,  color_code: '#059669', rows_count: 3, seats_per_row: 25, sort_order: 1 },
  { event_id: 2, name: 'Hạng A',  price: 600000,  color_code: '#3B82F6', rows_count: 4, seats_per_row: 25, sort_order: 2 },
  { event_id: 2, name: 'Hạng B',  price: 350000,  color_code: '#8B5CF6', rows_count: 3, seats_per_row: 30, sort_order: 3 },
  // Event 5
  { event_id: 5, name: 'Premium', price: 900000,  color_code: '#F59E0B', rows_count: 3, seats_per_row: 15, sort_order: 0 },
  { event_id: 5, name: 'Standard',price: 500000,  color_code: '#3B82F6', rows_count: 5, seats_per_row: 15, sort_order: 1 },
  { event_id: 5, name: 'Economy', price: 300000,  color_code: '#6B7280', rows_count: 4, seats_per_row: 15, sort_order: 2 },
  // Event 6
  { event_id: 6, name: 'VIP Khán Đài',    price: 800000,  color_code: '#F59E0B', rows_count: 3, seats_per_row: 20, sort_order: 0 },
  { event_id: 6, name: 'Thường Khán Đài', price: 400000,  color_code: '#3B82F6', rows_count: 5, seats_per_row: 20, sort_order: 1 },
  { event_id: 6, name: 'Khu Đứng',        price: 200000,  color_code: '#6B7280', rows_count: 2, seats_per_row: 30, sort_order: 2 },
  // Event 7
  { event_id: 7, name: 'VIP',     price: 1200000, color_code: '#059669', rows_count: 2, seats_per_row: 20, sort_order: 0 },
  { event_id: 7, name: 'Stall',   price: 750000,  color_code: '#F97316', rows_count: 5, seats_per_row: 24, sort_order: 1 },
  { event_id: 7, name: 'Balcony', price: 480000,  color_code: '#3B82F6', rows_count: 4, seats_per_row: 20, sort_order: 2 },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    
    // Check if event 2 already has zones
    const existing = await Zone.count({ where: { event_id: 2 } });
    if (existing > 0) {
      console.log('Zones already exist for these events. Skipping to avoid duplicates.');
      process.exit(0);
    }
    
    for (const zData of newZones) {
      const zone = await Zone.create(zData);
      
      const seats: any[] = [];
      const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      for (let r = 0; r < zone.rows_count; r++) {
        const rowLabel = rowLabels[r];
        for (let s = 1; s <= zone.seats_per_row; s++) {
          seats.push({
            zone_id: zone.id,
            row_label: rowLabel,
            seat_number: s,
            status: 'available',
          });
        }
      }
      
      const batchSize = 500;
      for (let i = 0; i < seats.length; i += batchSize) {
        await Seat.bulkCreate(seats.slice(i, i + batchSize));
      }
      
      console.log(`Created zone ${zone.name} with ${seats.length} seats for event ${zone.event_id}`);
    }
    
    console.log('Done adding seats.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
