// Seed script — runs once on first boot to create the default user
// Called from server/index.js at startup
import bcrypt from 'bcryptjs';
import db, { seedCategories } from './db.js';

const SEED_EMAIL    = process.env.SEED_EMAIL    || 'bpillai100@gmail.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD  || 'Natty@2025!!';
const SEED_NAME     = process.env.SEED_NAME      || 'Bala';

export function seedDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(SEED_EMAIL);
  if (existing) return;

  const hash = bcrypt.hashSync(SEED_PASSWORD, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).run(SEED_EMAIL, hash, SEED_NAME);

  seedCategories(result.lastInsertRowid);
  console.log(`✅ Default user seeded: ${SEED_EMAIL}`);
}
