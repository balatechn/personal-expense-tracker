import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── Get budgets ──────────────────────────────────────────
router.get('/', (req, res) => {
  const budgets = db.prepare(
    'SELECT * FROM budgets WHERE user_id = ?'
  ).all(req.userId);
  res.json(budgets);
});

// ── Set / update budget ──────────────────────────────────
router.post('/', (req, res) => {
  const { category = 'overall', amount, period = 'monthly' } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  db.prepare(
    `INSERT INTO budgets (user_id, category, amount, period)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, category, period) DO UPDATE SET amount = excluded.amount`
  ).run(req.userId, category, amount, period);

  const budget = db.prepare(
    'SELECT * FROM budgets WHERE user_id = ? AND category = ? AND period = ?'
  ).get(req.userId, category, period);

  res.json(budget);
});

// ── Delete budget ────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Budget not found' });
  res.json({ success: true });
});

export default router;
