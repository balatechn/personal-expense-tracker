import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── List categories ──────────────────────────────────────
router.get('/', (req, res) => {
  const cats = db.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name'
  ).all(req.userId);
  res.json(cats);
});

// ── Add custom category ──────────────────────────────────
router.post('/', (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });

  try {
    const result = db.prepare(
      'INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)'
    ).run(req.userId, name, icon || '📦', color || '#6366f1');
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cat);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw err;
  }
});

// ── Delete custom category ───────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0'
  ).run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found or is default' });
  res.json({ success: true });
});

// ── Smart category suggestion ────────────────────────────
router.get('/suggest', (req, res) => {
  const { text } = req.query;
  if (!text) return res.json({ suggestion: null });

  const keyword = text.toLowerCase();

  const KEYWORD_MAP = {
    Food:          ['food', 'zomato', 'swiggy', 'restaurant', 'lunch', 'dinner', 'breakfast', 'snack', 'pizza', 'burger', 'biryani', 'chai', 'tea', 'coffee', 'cafe', 'eat', 'meal', 'tiffin', 'canteen', 'mess'],
    Transport:     ['petrol', 'diesel', 'fuel', 'uber', 'ola', 'cab', 'taxi', 'bus', 'train', 'metro', 'auto', 'rickshaw', 'parking', 'toll', 'flight', 'travel'],
    Groceries:     ['grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bread', 'rice', 'dmart', 'bigbasket', 'zepto', 'blinkit', 'instamart', 'supermarket', 'kirana'],
    Bills:         ['bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'phone', 'recharge', 'rent', 'emi', 'insurance', 'tax', 'maintenance'],
    Shopping:      ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'fashion', 'electronics', 'gadget', 'appliance'],
    Entertainment: ['movie', 'netflix', 'hotstar', 'prime', 'spotify', 'game', 'gaming', 'concert', 'show', 'party', 'pub', 'bar', 'outing'],
    Health:        ['medicine', 'medical', 'doctor', 'hospital', 'pharmacy', 'gym', 'fitness', 'yoga', 'health', 'dental', 'eye', 'checkup', 'lab', 'test'],
    Education:     ['book', 'course', 'udemy', 'class', 'tuition', 'school', 'college', 'exam', 'stationery', 'education', 'study', 'library'],
  };

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => keyword.includes(kw))) {
      return res.json({ suggestion: category });
    }
  }

  // Check user's most frequent category for unmatched text
  const frequent = db.prepare(
    `SELECT category, COUNT(*) as cnt FROM expenses
     WHERE user_id = ? AND (note LIKE ? OR category LIKE ?)
     GROUP BY category ORDER BY cnt DESC LIMIT 1`
  ).get(req.userId, `%${text}%`, `%${text}%`);

  res.json({ suggestion: frequent ? frequent.category : 'Others' });
});

export default router;
