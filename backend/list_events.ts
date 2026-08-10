import { sequelize } from './src/config/database';
import { Event } from './src/models/Event';
import { Venue } from './src/models/Venue';

async function run() {
  try {
    await sequelize.authenticate();
    const events = await Event.findAll({
      include: [{ model: Venue, as: 'venue' }]
    });
    console.log(events.map((e: any) => ({
      id: e.id, 
      title: e.title, 
      venue: e.venue?.name
    })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
