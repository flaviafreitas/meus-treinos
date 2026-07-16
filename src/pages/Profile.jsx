import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import TabBar from '../components/TabBar'

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="4" width="8" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg
      className={`profile__about-chev${open ? ' profile__about-chev--open' : ''}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const [sobreAberto, setSobreAberto] = useState(false)

  const nomeUsuario = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Atleta'
  const inicial = nomeUsuario.charAt(0).toUpperCase()

  function sair() {
    if (confirm('Sair da conta?')) signOut()
  }

  return (
    <div className="profile">
      <h1 className="profile__title">Perfil</h1>

      <div className="profile__card">
        <span className="profile__avatar">{inicial}</span>
        <div className="profile__info">
          <span className="profile__name">{nomeUsuario}</span>
          <span className="profile__email">{user?.email}</span>
        </div>
      </div>

      <div className="profile__about">
        <button
          type="button"
          className="profile__about-row"
          onClick={() => setSobreAberto((v) => !v)}
          aria-expanded={sobreAberto}
        >
          <span className="profile__about-icon"><IconClipboard /></span>
          <span className="profile__about-label">Sobre o app</span>
          <IconChevron open={sobreAberto} />
        </button>
        {sobreAberto && (
          <div className="profile__about-content">
            <p className="profile__about-text">
              O Meus Treinos ajuda você a montar rotinas, acompanhar seus exercícios e ver sua evolução na academia.
            </p>
            <span className="profile__about-version">Versão 1.0</span>
          </div>
        )}
      </div>

      <button type="button" className="btn btn--outline-primary profile__logout" onClick={sair}>
        Sair
      </button>

      <TabBar active="perfil" />
    </div>
  )
}
