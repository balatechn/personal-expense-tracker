import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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

function AppContent() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const onSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
    setPage('dashboard');
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
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
      <AnimatePresence mode="wait">
        {pages[page]}
      </AnimatePresence>
      <BottomNav active={page} onChange={setPage} />
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
