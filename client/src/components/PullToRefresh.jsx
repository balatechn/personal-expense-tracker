import { useState, useRef, useCallback } from 'react';
import './PullToRefresh.css';

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const THRESHOLD = 70;

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || refreshing) return;
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    setPullY(Math.min(dy * 0.5, 100));
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(50);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    setPulling(false);
  }, [pullY, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      <div
        className={`ptr-indicator ${pullY > 0 || refreshing ? 'visible' : ''} ${refreshing ? 'refreshing' : ''}`}
        style={{ height: refreshing ? 40 : pullY > 10 ? pullY * 0.6 : 0 }}
      >
        <div className={`ptr-spinner ${pullY >= THRESHOLD || refreshing ? 'active' : ''}`} />
      </div>
      <div style={{ transform: `translateY(${refreshing ? 4 : pullY > 10 ? pullY * 0.15 : 0}px)`, transition: pulling ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
}
