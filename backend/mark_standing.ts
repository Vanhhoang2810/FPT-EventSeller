import { sequelize } from './src/config/database';
import { Zone } from './src/models/Zone';

async function run() {
  try {
    await sequelize.authenticate();
    
    // Set 'Khu Đứng' in Event 6 to 'standing'
    const [updated] = await Zone.update(
      { type: 'standing' },
      { where: { event_id: 6, name: 'Khu Đứng' } }
    );
    
    // Also set Event 7 'Balcony' to standing for testing if we want (skip for now)
    
    console.log(`Updated ${updated} zones to standing.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
