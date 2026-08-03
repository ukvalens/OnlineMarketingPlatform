require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');

async function run() {
  const { rowCount } = await pool.query(`
    DELETE FROM services
    WHERE id NOT IN (
      SELECT MIN(id::text)::uuid
      FROM services
      GROUP BY name
    )
  `);
  console.log(`Deleted ${rowCount} duplicate service(s).`);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
