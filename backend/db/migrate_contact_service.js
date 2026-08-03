require('dotenv').config();
const pool = require('../config/db');

pool.query("ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS service VARCHAR(150)")
  .then(() => { console.log('Done: service column added.'); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
