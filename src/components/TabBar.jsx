import { Link } from 'react-router-dom'

function IconInicio() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconTreinos() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconProgresso() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 19V5M5 19h14M8 16v-4M12 16V9M16 16v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPerfil() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const tabs = [
  { key: 'inicio', label: 'Início', to: '/', Icon: IconInicio },
  { key: 'treinos', label: 'Treinos', to: '/', Icon: IconTreinos },
  { key: 'progresso', label: 'Progresso', Icon: IconProgresso },
  { key: 'perfil', label: 'Perfil', Icon: IconPerfil },
]

export default function TabBar({ active = 'inicio' }) {
  return (
    <nav className="tabbar">
      {tabs.map(({ key, label, to, Icon }) => {
        const className = `tabbar__item${key === active ? ' tabbar__item--active' : ''}`
        const content = (
          <>
            <Icon />
            <span className="tabbar__label">{label}</span>
          </>
        )
        return to ? (
          <Link key={key} to={to} className={className}>{content}</Link>
        ) : (
          <span key={key} className={className}>{content}</span>
        )
      })}
    </nav>
  )
}
