const pool = require('../config/db');

async function migrate() {
  await pool.query(`
    ALTER TABLE team_members
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
  `);
  console.log('Migration done: team_members columns added');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
