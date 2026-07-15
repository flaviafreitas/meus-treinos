import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ImportarTreino from '../components/ImportarTreino'
import TabBar from '../components/TabBar'

function primeiraFoto(exercicios = []) {
  const ordenados = [...exercicios].sort((a, b) => {
    const pa = a.posicao ?? Infinity
    const pb = b.posicao ?? Infinity
    if (pa !== pb) return pa - pb
    return new Date(a.created_at) - new Date(b.created_at)
  })
  return ordenados.find((e) => e.foto_url)?.foto_url ?? null
}

export default function Rotinas() {
  const { user, signOut } = useAuth()
  const [rotinas, setRotinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalView, setModalView] = useState(null)
  const [editando, setEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  const nomeUsuario = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Atleta'
  const inicial = nomeUsuario.charAt(0).toUpperCase()

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase
      .from('rotinas')
      .select('id, nome, created_at, exercicios(foto_url, posicao, created_at)')
      .order('created_at', { ascending: false })
    if (error) setErro(error.message)
    else setRotinas(data ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriar() {
    setEditando(null)
    setNome('')
    setModalView('nome')
  }

  async function salvar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    if (editando) {
      await supabase.from('rotinas').update({ nome: nome.trim() }).eq('id', editando.id)
    } else {
      await supabase.from('rotinas').insert({ nome: nome.trim(), user_id: user.id })
    }
    setSalvando(false)
    setModalView(null)
    carregar()
  }

  const destaque = rotinas[0]
  const restantes = rotinas.slice(1)
  const tituloModal = modalView === 'importar' ? 'Montar com IA' : editando ? 'Editar rotina' : 'Nova rotina'

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <p className="home__hello">Bom treino,</p>
          <h1 className="home__name">{nomeUsuario}</h1>
        </div>
        <button
          type="button"
          className="home__avatar"
          onClick={() => { if (confirm('Sair da conta?')) signOut() }}
          aria-label="Sair"
        >
          {inicial}
        </button>
      </header>

      <div className="home__section">
        <h2 className="home__section-title">Meus treinos</h2>
      </div>

      {carregando && <p className="home__empty">Carregando…</p>}
      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {!carregando && !erro && rotinas.length === 0 && (
        <p className="home__empty">Você ainda não tem rotinas. Toque em “Nova rotina” pra começar.</p>
      )}

      {destaque && (
        <Link to={`/rotina/${destaque.id}`} className="featured">
          {primeiraFoto(destaque.exercicios) && (
            <img className="featured__img" src={primeiraFoto(destaque.exercicios)} alt="" loading="lazy" />
          )}
          <span className="featured__scrim" />
          <span className="featured__play" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <div className="featured__body">
            <h3 className="featured__title">{destaque.nome}</h3>
            <div className="chips">
              <span className="chip">{destaque.exercicios.length} exercícios</span>
            </div>
          </div>
        </Link>
      )}

      {restantes.length > 0 && (
        <ul className="home__list">
          {restantes.map((r) => {
            const foto = primeiraFoto(r.exercicios)
            return (
              <li key={r.id}>
                <Link to={`/rotina/${r.id}`} className="routine-card">
                  {foto ? (
                    <img className="routine-card__thumb" src={foto} alt="" loading="lazy" />
                  ) : (
                    <span className="routine-card__thumb routine-card__thumb--empty">💪</span>
                  )}
                  <div className="routine-card__info">
                    <span className="routine-card__name">{r.nome}</span>
                    <span className="routine-card__count">{r.exercicios.length} exercícios</span>
                  </div>
                  <span className="routine-card__chev" aria-hidden="true">›</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="home__new">
        <button type="button" className="btn btn--text" onClick={() => setModalView('choice')}>
          Nova rotina
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <TabBar active="inicio" />

      <Modal titulo={tituloModal} aberto={modalView !== null} onFechar={() => setModalView(null)}>
        {modalView === 'choice' && (
          <div className="sheet__options">
            <button type="button" className="btn btn--outline" onClick={abrirCriar}>Criar do zero</button>
            <button type="button" className="btn btn--outline" onClick={() => setModalView('importar')}>Montar com IA</button>
          </div>
        )}
        {modalView === 'nome' && (
          <form onSubmit={salvar} className="sheet__form">
            <label className="field">
              <span className="field__label">Nome da rotina</span>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Treino A - Peito e tríceps"
                autoFocus
                required
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </form>
        )}
        {modalView === 'importar' && (
          <ImportarTreino onImportado={() => { setModalView(null); carregar() }} />
        )}
      </Modal>
    </div>
  )
}
