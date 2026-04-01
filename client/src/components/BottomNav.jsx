import { useTheme } from '../context/ThemeContext';
import './BottomNav.css';

const tabs = [
  { id: 'dashboard',    icon: '📊', label: 'Home' },
  { id: 'add',          icon: '➕', label: 'Add' },
  { id: 'history',      icon: '📋', label: 'History' },
  { id: 'settings',     icon: '⚙️', label: 'Settings' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav glass">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-item ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
