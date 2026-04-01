import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { seedCategories } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

// ── Register ─────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).run(email, hash, name || '');

  seedCategories(result.lastInsertRowid);

  const user = { id: result.lastInsertRowid, email, name: name || '' };
  const token = generateToken(user);

  res.status(201).json({ token, user: { id: user.id, email, name: user.name } });
});

// ── Login ────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, currency: user.currency } });
});

// ── Get current user ─────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, currency, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
