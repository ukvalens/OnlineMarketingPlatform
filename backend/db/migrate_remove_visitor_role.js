require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Reassign any existing visitor users to client before removing the enum value
    const { rowCount } = await client.query(
      `UPDATE users SET role = 'client' WHERE role = 'visitor'`
    );
    if (rowCount > 0) console.log(`✓ Reassigned ${rowCount} visitor user(s) to client`);

    // PostgreSQL requires renaming the old type and creating a new one to remove an enum value
    await client.query(`ALTER TYPE user_role RENAME TO user_role_old`);
    await client.query(`CREATE TYPE user_role AS ENUM ('client', 'staff', 'editor', 'finance', 'admin')`);
    await client.query(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
    await client.query(`ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role`);
    await client.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'`);
    await client.query(`DROP TYPE user_role_old`);

    await client.query('COMMIT');
    console.log('✓ Removed visitor from user_role enum');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
