require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id          BIGSERIAL PRIMARY KEY,
      path        VARCHAR(500) NOT NULL,
      referrer    VARCHAR(500),
      user_agent  TEXT,
      ip          VARCHAR(100),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_page_views_path       ON page_views(path);
    CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
  `);
  console.log('page_views table ready.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
