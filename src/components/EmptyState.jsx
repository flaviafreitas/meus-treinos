function Dumbbell() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function EmptyState({ icon, children }) {
  return (
    <div className="empty">
      <span className="empty__icon">{icon ?? <Dumbbell />}</span>
      <p className="empty__text">{children}</p>
    </div>
  )
}
