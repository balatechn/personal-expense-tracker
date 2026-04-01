import { hapticTap } from '../utils/haptics';
import './BottomNav.css';

const tabs = [
  { id: 'dashboard', icon: '📊', label: 'Home' },
  { id: 'history',   icon: '📋', label: 'History' },
  { id: 'add',       icon: '➕', label: 'Add', fab: true },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav glass">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-item ${t.fab ? 'nav-fab' : ''} ${active === t.id ? 'active' : ''}`}
          onClick={() => { hapticTap(); onChange(t.id); }}
        >
          {t.fab ? (
            <span className="fab-circle">{t.icon}</span>
          ) : (
            <>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {active === t.id && <span className="nav-dot" />}
            </>
          )}
        </button>
      ))}
    </nav>
  );
}
