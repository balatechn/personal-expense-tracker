import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { budgets } from '../api';
import { hapticTap, hapticSuccess } from '../utils/haptics';
import './Settings.css';

export default function Settings({ toast }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [budgetAmount, setBudgetAmount] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  async function handleSetBudget() {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    setSavingBudget(true);
    try {
      await budgets.set({ category: 'overall', amount: parseFloat(budgetAmount), period: 'monthly' });
      hapticSuccess();
      toast.success('Budget set!');
      setBudgetAmount('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingBudget(false);
    }
  }

  function handleExport() {
    // Simple CSV export
    const token = localStorage.getItem('token');
    fetch('/api/expenses?limit=10000', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const rows = [['Date', 'Category', 'Amount', 'Note']];
        data.expenses.forEach(e => rows.push([e.date, e.category, e.amount, e.note || '']));
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported!');
      })
      .catch(() => toast.error('Export failed'));
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {/* Profile */}
      <div className="card settings-section">
        <h3>Profile</h3>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user?.email}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Name</span>
          <span className="settings-value">{user?.name || '—'}</span>
        </div>
      </div>

      {/* Theme */}
      <div className="card settings-section">
        <h3>Appearance</h3>
        <div className="settings-row clickable" onClick={() => { hapticTap(); toggle(); }}>
          <span className="settings-label">🌙 Dark Mode</span>
          <div className={`toggle ${dark ? 'on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="card settings-section">
        <h3>Monthly Budget</h3>
        <p className="settings-desc">Set a monthly spending limit to get alerts.</p>
        <div className="budget-input-row">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 15000"
            value={budgetAmount}
            onChange={e => setBudgetAmount(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSetBudget} disabled={savingBudget}>
            {savingBudget ? '...' : 'Set'}
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="card settings-section">
        <h3>Data</h3>
        <button className="btn btn-outline btn-full" onClick={handleExport}>
          📥 Export to CSV
        </button>
      </div>

      {/* Logout */}
      <button className="btn btn-danger btn-full" style={{ marginTop: 16 }} onClick={() => { hapticTap(); logout(); }}>
        🚿 Sign Out
      </button>
    </div>
  );
}
