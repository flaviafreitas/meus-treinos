function Dumbbell() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth__logo">
        <div className="auth__mark">
          <Dumbbell />
        </div>
        <div className="auth__heading">
          <h1 className="auth__title">Meus Treinos</h1>
          <p className="auth__subtitle">Suas rotinas de treino, sempre com você</p>
        </div>
      </div>
      {children}
    </div>
  )
}
