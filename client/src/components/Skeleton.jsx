import './Skeleton.css';

export function SkeletonBox({ width, height, radius, style }) {
  return (
    <div
      className="skeleton-box"
      style={{ width: width || '100%', height: height || 16, borderRadius: radius || 8, ...style }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-wrap">
      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <SkeletonBox height={42} radius={10} />
        <SkeletonBox height={42} radius={10} />
        <SkeletonBox height={42} radius={10} />
      </div>
      {/* Total card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: 24 }}>
        <SkeletonBox width={100} height={14} style={{ margin: '0 auto 12px' }} />
        <SkeletonBox width={180} height={36} style={{ margin: '0 auto 16px' }} />
        <SkeletonBox height={8} radius={8} />
        <SkeletonBox width={140} height={12} style={{ margin: '8px auto 0' }} />
      </div>
      {/* Chart card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SkeletonBox width={100} height={16} style={{ marginBottom: 16 }} />
        <SkeletonBox height={160} radius={12} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <SkeletonBox height={14} />
          <SkeletonBox height={14} width="80%" />
          <SkeletonBox height={14} width="60%" />
        </div>
      </div>
      {/* Recent items */}
      <div className="card">
        <SkeletonBox width={60} height={16} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox width={80} height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width={120} height={11} />
            </div>
            <SkeletonBox width={60} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="skeleton-wrap">
      {[1, 2].map(g => (
        <div key={g} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px' }}>
            <SkeletonBox width={70} height={12} />
            <SkeletonBox width={50} height={12} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <SkeletonBox width={70} height={14} style={{ marginBottom: 6 }} />
                <SkeletonBox width={120} height={11} />
              </div>
              <SkeletonBox width={55} height={16} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
