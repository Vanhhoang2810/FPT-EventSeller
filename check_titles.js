const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ticketrush', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function run() {
  const [events] = await sequelize.query('SELECT id, title FROM events WHERE id IN (2, 6)');
  console.log(JSON.stringify(events, null, 2));
  process.exit(0);
}

run();
