/**
 * backend/db/seed-demo-users.js
 *
 * Changes:
 * - Added 3 real accounts: ukwitegetsev9@gmail.com (admin),
 *   ukwitegetsevalens78@gmail.com (staff), niyigaba202@gmail.com (finance).
 * - All 8 users seeded with email_verified=TRUE, is_active=TRUE.
 * - Uses ON CONFLICT DO UPDATE to keep credentials fresh on re-run.
 * - All users share the demo password: Demo@1234.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const DEMO_PASSWORD = 'Demo@1234';

const USERS = [
  { name: 'Demo Admin',          email: 'admin@demo.rw',              phone: '+250780000011', role: 'admin' },
  { name: 'Demo Client',         email: 'client@demo.rw',             phone: '+250780000012', role: 'client' },
  { name: 'Demo Staff',          email: 'staff@demo.rw',              phone: '+250780000013', role: 'staff' },
  { name: 'Demo Editor',         email: 'editor@demo.rw',             phone: '+250780000014', role: 'editor' },
  { name: 'Demo Finance',        email: 'finance@demo.rw',            phone: '+250780000015', role: 'finance' },
  { name: 'UKWITEGETSE Valens',  email: 'ukwitegetsev9@gmail.com',    phone: '+250780000001', role: 'admin' },
  { name: 'Valens Staff',        email: 'ukwitegetsevalens78@gmail.com', phone: '+250780000002', role: 'staff' },
  { name: 'Niyigaba',            email: 'niyigaba202@gmail.com',      phone: '+250780000003', role: 'finance' },
  { name: 'Aaron Hagenimana',    email: 'aaronhagenimana6@gmail.com', phone: '+250780000004', role: 'editor' },
];

async function run() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const u of USERS) {
    await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verified, is_active)
       VALUES ($1,$2,$3,$4,$5, TRUE, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET role = EXCLUDED.role,
             email_verified = TRUE,
             is_active = TRUE,
             password_hash = EXCLUDED.password_hash`,
      [u.name, u.email, u.phone, hash, u.role]
    );
    console.log(`✓ ${u.role}: ${u.email}`);
  }
  console.log(`\nAll demo users seeded. Password: ${DEMO_PASSWORD}`);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
