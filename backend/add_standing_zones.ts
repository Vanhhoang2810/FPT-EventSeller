import { sequelize } from './src/config/database';
import { Zone } from './src/models/Zone';
import { Seat } from './src/models/Seat';

async function run() {
  try {
    await sequelize.authenticate();
    
    // We will add standing zones for Event 7 (Những Thành Phố Mơ Màng)
    // and Event 2 (The Story) as they are large events.
    
    const eventsToAdd = [
      { event_id: 7, basePrice: 450000 },
      { event_id: 2, basePrice: 600000 }
    ];
    
    for (const evt of eventsToAdd) {
      // Create 2 standing zones: Left and Right
      const zones = [
        {
          event_id: evt.event_id,
          name: 'GA Trái (vé đứng)',
          type: 'standing' as const,
          price: evt.basePrice,
          color_code: '#3b82f6', // blue
          rows_count: 0,
          seats_per_row: 0,
          sort_order: 10
        },
        {
          event_id: evt.event_id,
          name: 'GA Phải (vé đứng)',
          type: 'standing' as const,
          price: evt.basePrice,
          color_code: '#ec4899', // pink
          rows_count: 0,
          seats_per_row: 0,
          sort_order: 11
        }
      ];
      
      const createdZones = await Zone.bulkCreate(zones);
      console.log(`Created standing zones for event ${evt.event_id}`);
      
      // Create 500 pseudo-seats for each zone
      const seatsToInsert = [];
      for (const zone of createdZones) {
        for (let i = 1; i <= 500; i++) {
          seatsToInsert.push({
            zone_id: zone.id,
            row_label: 'SD',
            seat_number: i,
            status: 'available' as const,
          });
        }
      }
      
      // Bulk insert 1000 seats per event
      await Seat.bulkCreate(seatsToInsert);
      console.log(`Created 1000 pseudo-seats for event ${evt.event_id}`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
