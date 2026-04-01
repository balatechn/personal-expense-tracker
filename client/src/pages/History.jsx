import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenses, categories as catApi } from '../api';
import './History.css';

export default function History({ toast, refreshKey }) {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ category: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.category)  params.category  = filter.category;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate)   params.endDate   = filter.endDate;
      params.limit = 200;
      const data = await expenses.list(params);
      setItems(data.expenses);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { catApi.list().then(setCats).catch(() => {}); }, []);

  async function handleDelete(id) {
    try {
      await expenses.delete(id);
      setItems(i => i.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error(e.message);
    }
  }

  function startEdit(item) {
    setEditItem(item.id);
    setEditForm({ amount: item.amount, category: item.category, note: item.note, date: item.date });
  }

  async function saveEdit() {
    try {
      const updated = await expenses.update(editItem, editForm);
      setItems(i => i.map(x => x.id === editItem ? updated : x));
      setEditItem(null);
      toast.success('Updated');
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Group by date
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>History</h1>
        <button
          className="btn btn-icon"
          style={{ background: 'var(--bg-glass)', border: '1.5px solid var(--border)' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="card filter-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-row">
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>From</label>
                <input className="input" type="date" value={filter.startDate}
                  onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>To</label>
                <input className="input" type="date" value={filter.endDate}
                  onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label>Category</label>
              <select className="input" value={filter.category}
                onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                <option value="">All</option>
                {cats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <button className="btn btn-outline btn-full" style={{ marginTop: 12 }}
              onClick={() => setFilter({ category: '', startDate: '', endDate: '' })}>
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="spinner" />}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No transactions found</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, dayItems]) => (
        <div key={date} className="day-group">
          <div className="day-header">
            <span>{formatDate(date)}</span>
            <span className="day-total">
              ₹{dayItems.reduce((s, x) => s + x.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <AnimatePresence>
            {dayItems.map(item => (
              <motion.div
                key={item.id}
                className="expense-row card"
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                {editItem === item.id ? (
                  <div className="edit-form">
                    <input className="input" type="number" value={editForm.amount}
                      onChange={e => setEditForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                    <select className="input" value={editForm.category}
                      onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                      {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <input className="input" value={editForm.note}
                      onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} placeholder="Note" />
                    <div className="edit-actions">
                      <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                      <button className="btn btn-outline" onClick={() => setEditItem(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="expense-info">
                      <span className="expense-cat">{item.category}</span>
                      <span className="expense-note">{item.note || '—'}</span>
                    </div>
                    <div className="expense-right">
                      <span className="expense-amount">₹{item.amount.toLocaleString('en-IN')}</span>
                      <div className="expense-actions">
                        <button className="small-btn" onClick={() => startEdit(item)}>✏️</button>
                        <button className="small-btn del" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

function formatDate(d) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return 'Today';
  if (d === yesterday) return 'Yesterday';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}
