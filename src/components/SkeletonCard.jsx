const SkeletonCard = () => (
  <li className="skeleton-card">
    <div className="skeleton-bar" style={{ height: 18, width: '55%', marginBottom: 8 }} />
    <div className="skeleton-bar" style={{ height: 13, width: '75%', marginBottom: 8 }} />
    <div className="skeleton-bar" style={{ height: 13, width: '30%' }} />
  </li>
);

export default SkeletonCard;
