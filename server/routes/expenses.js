import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── Add Expense ──────────────────────────────────────────
router.post('/', (req, res) => {
  const { amount, category, category_id, note, date } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const stmt = db.prepare(
    `INSERT INTO expenses (user_id, amount, category, category_id, note, date)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    req.userId,
    amount,
    category || 'Others',
    category_id || null,
    note || '',
    date || new Date().toISOString().slice(0, 10)
  );

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(expense);
});

// ── List Expenses (with filters & pagination) ────────────
router.get('/', (req, res) => {
  const { startDate, endDate, category, limit = 50, offset = 0 } = req.query;

  let sql = 'SELECT * FROM expenses WHERE user_id = ?';
  const params = [req.userId];

  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(sql).all(...params);

  // Get total count for pagination
  let countSql = 'SELECT COUNT(*) as total FROM expenses WHERE user_id = ?';
  const countParams = [req.userId];
  if (startDate) { countSql += ' AND date >= ?'; countParams.push(startDate); }
  if (endDate)   { countSql += ' AND date <= ?'; countParams.push(endDate); }
  if (category)  { countSql += ' AND category = ?'; countParams.push(category); }

  const { total } = db.prepare(countSql).get(...countParams);
  res.json({ expenses: rows, total, limit: Number(limit), offset: Number(offset) });
});

// ── Dashboard Summary (MUST be before /:id) ──────────────
router.get('/stats/summary', (req, res) => {
  const { period = 'month' } = req.query;
  const today = new Date().toISOString().slice(0, 10);

  let startDate;
  if (period === 'day') {
    startDate = today;
  } else if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    startDate = d.toISOString().slice(0, 10);
  } else {
    startDate = today.slice(0, 7) + '-01';
  }

  const total2 = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?'
  ).get(req.userId, startDate, today);

  const byCategory = db.prepare(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
     GROUP BY category ORDER BY total DESC`
  ).all(req.userId, startDate, today);

  const dailyTotals = db.prepare(
    `SELECT date, SUM(amount) as total
     FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
     GROUP BY date ORDER BY date`
  ).all(req.userId, startDate, today);

  const recentExpenses = db.prepare(
    'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 5'
  ).all(req.userId);

  const budget = db.prepare(
    "SELECT * FROM budgets WHERE user_id = ? AND category = 'overall' AND period = 'monthly'"
  ).get(req.userId);

  res.json({
    total: total2.total,
    byCategory,
    dailyTotals,
    recentExpenses,
    budget: budget || null,
    period,
    startDate,
    endDate: today,
  });
});

// ── Get Single Expense ───────────────────────────────────
router.get('/:id', (req, res) => {
  const expense = db.prepare(
    'SELECT * FROM expenses WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

// ── Update Expense ───────────────────────────────────────
router.put('/:id', (req, res) => {
  const existing = db.prepare(
    'SELECT * FROM expenses WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  const { amount, category, category_id, note, date } = req.body;
  db.prepare(
    `UPDATE expenses SET amount = ?, category = ?, category_id = ?, note = ?, date = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    amount ?? existing.amount,
    category ?? existing.category,
    category_id ?? existing.category_id,
    note ?? existing.note,
    date ?? existing.date,
    req.params.id,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ── Delete Expense ───────────────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true });
});

export default router;
