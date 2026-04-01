import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { expenses } from '../api';
import { useAuth } from '../context/AuthContext';
import { DashboardSkeleton } from '../components/Skeleton';
import PullToRefresh from '../components/PullToRefresh';
import { hapticTap } from '../utils/haptics';
import './Dashboard.css';

const COLORS = ['#f97316','#3b82f6','#22c55e','#eab308','#ec4899','#8b5cf6','#ef4444','#06b6d4','#6b7280'];

export default function Dashboard({ toast }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return expenses.summary(period)
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    await expenses.summary(period).then(setData).catch(() => {});
  }, [period]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Hi, {user?.name || 'there'} 👋</h1>
      </div>

      {/* Period tabs */}
      <div className="period-tabs">
        {['day', 'week', 'month'].map(p => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => { hapticTap(); setPeriod(p); }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <DashboardSkeleton /> : !data ? null : (
        <PullToRefresh onRefresh={handleRefresh}>

      {(() => {
        const budgetPercent = data.budget
          ? Math.min((data.total / data.budget.amount) * 100, 100)
          : null;
        return (
          <>
      {/* Total card */}
      <div className="total-card card">
        <span className="total-label">Total Spent</span>
        <span className="total-amount">₹{data.total.toLocaleString('en-IN')}</span>
        {budgetPercent !== null && (
          <div className="budget-bar-wrap">
            <div className="budget-bar">
              <div
                className="budget-fill"
                style={{
                  width: `${budgetPercent}%`,
                  background: budgetPercent > 80 ? 'var(--gradient-red)' : 'var(--gradient-green)',
                }}
              />
            </div>
            <span className="budget-label">
              {budgetPercent.toFixed(0)}% of ₹{data.budget.amount.toLocaleString('en-IN')} budget
            </span>
          </div>
        )}
      </div>

      {/* Category chart */}
      {data.byCategory.length > 0 && (
        <div className="card chart-card">
          <h3>By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.byCategory}
                dataKey="total"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="cat-legend">
            {data.byCategory.map((c, i) => (
              <div key={c.category} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="legend-name">{c.category}</span>
                <span className="legend-val">₹{c.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily bar chart */}
      {data.dailyTotals.length > 1 && (
        <div className="card chart-card">
          <h3>Daily Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.dailyTotals}>
              <XAxis
                dataKey="date"
                tickFormatter={d => d.slice(8)}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                labelFormatter={(d) => d}
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              />
              <Bar dataKey="total" fill="url(#barGrad)" radius={[6,6,0,0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent expenses */}
      {data.recentExpenses.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Recent</h3>
          {data.recentExpenses.map(exp => (
            <div key={exp.id} className="recent-item animate-fade-in-up">
              <div className="recent-info">
                <span className="recent-cat">{exp.category}</span>
                <span className="recent-note">{exp.note || '—'}</span>
              </div>
              <span className="recent-amount">-₹{exp.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      {data.byCategory.length === 0 && (
        <div className="empty-state">
          <div className="icon">📝</div>
          <p>No expenses yet this {period}. Tap + to add one!</p>
        </div>
      )}
          </>
        );
      })()}
        </PullToRefresh>
      )}
    </div>
  );
}
