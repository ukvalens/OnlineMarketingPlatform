require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const DEMO_PASSWORD = 'Demo@1234';

const USERS = [
  { name: 'Demo Admin',   email: 'admin@demo.rw',   phone: '+250780000011', role: 'admin' },
  { name: 'Demo Client',  email: 'client@demo.rw',  phone: '+250780000012', role: 'client' },
  { name: 'Demo Staff',   email: 'staff@demo.rw',   phone: '+250780000013', role: 'staff' },
  { name: 'Demo Editor',  email: 'editor@demo.rw',  phone: '+250780000014', role: 'editor' },
  { name: 'Demo Finance', email: 'finance@demo.rw', phone: '+250780000015', role: 'finance' },
];

async function run() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const u of USERS) {
    await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, u.phone, hash, u.role]
    );
    console.log(`✓ ${u.role}: ${u.email}`);
  }
  console.log(`\nAll demo users seeded. Password: ${DEMO_PASSWORD}`);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
