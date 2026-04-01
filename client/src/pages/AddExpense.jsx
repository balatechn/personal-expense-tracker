import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { expenses, categories as catApi } from '../api';
import { useVoice, parseVoiceInput } from '../hooks/useVoice';
import './AddExpense.css';

export default function AddExpense({ toast, onSaved }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cats, setCats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    catApi.list().then(setCats).catch(() => {});
  }, []);

  // Voice input handler
  const handleVoice = useCallback((text) => {
    const parsed = parseVoiceInput(text);
    if (parsed.amount) setAmount(String(parsed.amount));
    if (parsed.category) setCategory(parsed.category);
    if (parsed.note) setNote(parsed.note);
    toast.info(`Heard: "${text}"`);
  }, [toast]);

  const { listening, start, stop, supported } = useVoice(handleVoice);

  // Smart category suggestion based on note
  useEffect(() => {
    if (!note || note.length < 2) { setSuggestion(null); return; }
    const timer = setTimeout(() => {
      catApi.suggest(note).then(r => {
        if (r.suggestion && r.suggestion !== category) {
          setSuggestion(r.suggestion);
        }
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [note]);

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const catObj = cats.find(c => c.name === category);
      await expenses.create({
        amount: parseFloat(amount),
        category,
        category_id: catObj?.id || null,
        note,
        date,
      });
      toast.success(`₹${amount} saved!`);
      setAmount(''); setNote(''); setCategory('Food');
      setDate(new Date().toISOString().slice(0, 10));
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Add Expense</h1>
        {supported && (
          <button
            className={`btn btn-icon voice-btn ${listening ? 'listening' : ''}`}
            onClick={listening ? stop : start}
            title="Voice input"
          >
            🎙️
          </button>
        )}
      </div>

      {listening && (
        <div className="voice-indicator">
          <div className="voice-wave" />
          <span>Listening... speak now</span>
        </div>
      )}

      {/* Amount */}
      <div className="amount-section card">
        <label>Amount (₹)</label>
        <input
          className="input input-amount"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
      </div>

      {/* Category */}
      <div className="section">
        <label className="section-label">Category</label>
        <div className="cat-pills">
          {cats.map(c => (
            <button
              key={c.id}
              className={`cat-pill ${category === c.name ? 'active' : ''}`}
              onClick={() => setCategory(c.name)}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
        {suggestion && suggestion !== category && (
          <motion.div
            className="suggestion"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            💡 Did you mean <strong>{suggestion}</strong>?
            <button onClick={() => { setCategory(suggestion); setSuggestion(null); }}>
              Yes
            </button>
          </motion.div>
        )}
      </div>

      {/* Note */}
      <div className="input-group">
        <label>Note (optional)</label>
        <input
          className="input"
          placeholder="e.g. Zomato order, groceries..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="input-group">
        <label>Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Save */}
      <button
        className="btn btn-green btn-full save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : '💾 Save Expense'}
      </button>
    </motion.div>
  );
}
