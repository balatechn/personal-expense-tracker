import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import { seedDefaultUser } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Seed default user on first boot ──────────────────────
seedDefaultUser();

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// ── Public auth routes (register, login) + protected /me ─
app.use('/api/auth', authRoutes);

// ── Protected routes ─────────────────────────────────────
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/budgets', authenticate, budgetRoutes);

// ── Serve frontend in production ─────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Expense Tracker API running on http://localhost:${PORT}`);
});
