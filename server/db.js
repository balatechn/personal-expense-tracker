import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './data/expenses.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    name        TEXT    NOT NULL DEFAULT '',
    currency    TEXT    NOT NULL DEFAULT 'INR',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    icon        TEXT    NOT NULL DEFAULT '📦',
    color       TEXT    NOT NULL DEFAULT '#6366f1',
    is_default  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    amount      REAL    NOT NULL,
    category_id INTEGER,
    category    TEXT    NOT NULL DEFAULT 'Others',
    note        TEXT    DEFAULT '',
    date        TEXT    NOT NULL DEFAULT (date('now')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'overall',
    amount      REAL    NOT NULL,
    period      TEXT    NOT NULL DEFAULT 'monthly',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, category, period)
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_expenses_user_cat  ON expenses(user_id, category);
`);

// ── Seed default categories for a new user ───────────────
const DEFAULT_CATEGORIES = [
  { name: 'Food',          icon: '🍔', color: '#f97316' },
  { name: 'Transport',     icon: '🚗', color: '#3b82f6' },
  { name: 'Groceries',     icon: '🛒', color: '#22c55e' },
  { name: 'Bills',         icon: '💡', color: '#eab308' },
  { name: 'Shopping',      icon: '🛍️', color: '#ec4899' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { name: 'Health',        icon: '💊', color: '#ef4444' },
  { name: 'Education',     icon: '📚', color: '#06b6d4' },
  { name: 'Others',        icon: '📦', color: '#6b7280' },
];

export function seedCategories(userId) {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO categories (user_id, name, icon, color, is_default)
     VALUES (?, ?, ?, ?, 1)`
  );
  const tx = db.transaction(() => {
    for (const c of DEFAULT_CATEGORIES) {
      insert.run(userId, c.name, c.icon, c.color);
    }
  });
  tx();
}

export default db;
