import { sequelize } from './src/config/database';
import { Zone } from './src/models/Zone';
import { Seat } from './src/models/Seat';
import { Op } from 'sequelize';

async function run() {
  try {
    await sequelize.authenticate();
    
    // Find all standing zones
    const standingZones = await Zone.findAll({ where: { type: 'standing' } });
    const zoneIds = standingZones.map(z => z.id);
    
    if (zoneIds.length > 0) {
      // Delete seats with seat_number > 150 for these zones
      const deleted = await Seat.destroy({
        where: {
          zone_id: { [Op.in]: zoneIds },
          seat_number: { [Op.gt]: 150 }
        }
      });
      console.log(`Deleted ${deleted} pseudo-seats to cap capacity at 150 per standing zone.`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
