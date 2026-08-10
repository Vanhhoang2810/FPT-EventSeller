import { sequelize } from './src/config/database';
import { Zone } from './src/models/Zone';

async function fixZones() {
  try {
    await sequelize.authenticate();
    console.log('Connected.');
    
    // Event 2 zones
    const zones2 = await Zone.findAll({ where: { event_id: 2 }, order: [['sort_order', 'ASC']] });
    if (zones2.length >= 4) {
      await zones2[2].update({ name: 'Hạng A' });
      await zones2[3].update({ name: 'Hạng B' });
      console.log('Fixed Event 2 zones.');
    }
    
    // Event 6 zones
    const zones6 = await Zone.findAll({ where: { event_id: 6 }, order: [['sort_order', 'ASC']] });
    if (zones6.length >= 3) {
      await zones6[0].update({ name: 'VIP Khán Đài' });
      await zones6[1].update({ name: 'Thường Khán Đài' });
      await zones6[2].update({ name: 'Khu Đứng' });
      console.log('Fixed Event 6 zones.');
    }
    
    console.log('Done fixing zone names.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixZones();
