import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import BottomNav from './components/BottomNav';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import History from './pages/History';
import Settings from './pages/Settings';

const TAB_ORDER = { dashboard: 0, history: 1, add: 2, settings: 3 };

const pageVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function AppContent() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const dirRef = useRef(0);

  const navigate = useCallback((p) => {
    dirRef.current = TAB_ORDER[p] > TAB_ORDER[page] ? 1 : -1;
    setPage(p);
  }, [page]);

  const onSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
    dirRef.current = -1;
    setPage('dashboard');
  }, []);

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-icon">💰</div>
        <div className="splash-title">Expense Tracker</div>
        <div className="spinner" style={{ marginTop: 24 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toast.toasts} />
        <AuthPage toast={toast} />
      </>
    );
  }

  const pages = {
    dashboard: <Dashboard toast={toast} key={`dash-${refreshKey}`} />,
    add:       <AddExpense toast={toast} onSaved={onSaved} />,
    history:   <History toast={toast} refreshKey={refreshKey} />,
    settings:  <Settings toast={toast} />,
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} />
      <AnimatePresence mode="wait" custom={dirRef.current}>
        <motion.div
          key={page}
          custom={dirRef.current}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {pages[page]}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={page} onChange={navigate} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
