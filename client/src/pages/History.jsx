import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenses, categories as catApi } from '../api';
import BottomSheet from '../components/BottomSheet';
import { HistorySkeleton } from '../components/Skeleton';
import PullToRefresh from '../components/PullToRefresh';
import { hapticTap, hapticSuccess, hapticError } from '../utils/haptics';
import './History.css';

export default function History({ toast, refreshKey }) {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
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
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { catApi.list().then(setCats).catch(() => {}); }, []);

  const handleRefresh = useCallback(async () => {
    const params = { limit: 200 };
    if (filter.category)  params.category  = filter.category;
    if (filter.startDate) params.startDate = filter.startDate;
    if (filter.endDate)   params.endDate   = filter.endDate;
    await expenses.list(params).then(d => setItems(d.expenses)).catch(() => {});
  }, [filter]);

  async function handleDelete(id) {
    try {
      await expenses.delete(id);
      setItems(i => i.filter(x => x.id !== id));
      hapticSuccess();
      toast.success('Deleted');
    } catch (e) {
      hapticError();
      toast.error(e.message);
    }
  }

  function startEdit(item) {
    hapticTap();
    setEditItem(item);
    setEditForm({ amount: item.amount, category: item.category, note: item.note, date: item.date });
  }

  async function saveEdit() {
    try {
      const updated = await expenses.update(editItem.id, editForm);
      setItems(i => i.map(x => x.id === editItem.id ? updated : x));
      setEditItem(null);
      hapticSuccess();
      toast.success('Updated');
    } catch (e) {
      hapticError();
      toast.error(e.message);
    }
  }

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>History</h1>
        <button
          className="btn btn-icon"
          style={{ background: 'var(--bg-glass)', border: '1.5px solid var(--border)' }}
          onClick={() => { hapticTap(); setShowFilters(true); }}
        >
          🔍
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet open={showFilters} onClose={() => setShowFilters(false)} title="Filters">
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
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline btn-full"
            onClick={() => { setFilter({ category: '', startDate: '', endDate: '' }); }}>
            Clear
          </button>
          <button className="btn btn-primary btn-full"
            onClick={() => setShowFilters(false)}>
            Apply
          </button>
        </div>
      </BottomSheet>

      {/* Edit Bottom Sheet */}
      <BottomSheet open={!!editItem} onClose={() => setEditItem(null)} title="Edit Expense">
        <div className="input-group">
          <label>Amount (₹)</label>
          <input className="input" type="number" inputMode="decimal" value={editForm.amount}
            onChange={e => setEditForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="input-group">
          <label>Category</label>
          <select className="input" value={editForm.category}
            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
            {cats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Note</label>
          <input className="input" value={editForm.note || ''}
            onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} placeholder="Note" />
        </div>
        <div className="input-group">
          <label>Date</label>
          <input className="input" type="date" value={editForm.date}
            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <button className="btn btn-primary btn-full" onClick={saveEdit}>Save Changes</button>
      </BottomSheet>

      {loading ? <HistorySkeleton /> : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No transactions found</p>
        </div>
      ) : (
        <PullToRefresh onRefresh={handleRefresh}>
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
                  <SwipeRow key={item.id} onDelete={() => handleDelete(item.id)}>
                    <div className="expense-row card" onClick={() => startEdit(item)}>
                      <div className="expense-info">
                        <span className="expense-cat">{item.category}</span>
                        <span className="expense-note">{item.note || '—'}</span>
                      </div>
                      <span className="expense-amount">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </SwipeRow>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </PullToRefresh>
      )}
    </div>
  );
}

function SwipeRow({ children, onDelete }) {
  return (
    <motion.div
      className="swipe-container"
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    >
      <div className="swipe-behind">
        <span>🗑️ Delete</span>
      </div>
      <motion.div
        className="swipe-front"
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete();
        }}
      >
        {children}
      </motion.div>
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
