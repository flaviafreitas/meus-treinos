import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ImportarTreino from '../components/ImportarTreino'
import TabBar from '../components/TabBar'
import Card from '../components/Card'
import SkeletonCard from '../components/SkeletonCard'
import Skeleton from 'react-loading-skeleton'

function primeiraFoto(exercicios = []) {
  const ordenados = [...exercicios].sort((a, b) => {
    const pa = a.posicao ?? Infinity
    const pb = b.posicao ?? Infinity
    if (pa !== pb) return pa - pb
    return new Date(a.created_at) - new Date(b.created_at)
  })
  return ordenados.find((e) => e.foto_url)?.foto_url ?? null
}

function proximoTreino(rotinas, ultimoTreino) {
  if (rotinas.length === 0) return -1
  if (!ultimoTreino) return 0
  const idx = rotinas.findIndex((r) => r.id === ultimoTreino)
  if (idx === -1) return 0
  return (idx + 1) % rotinas.length
}

export default function Rotinas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rotinas, setRotinas] = useState([])
  const [ultimoTreino, setUltimoTreino] = useState(null)
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
      .order('created_at', { ascending: true })
    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }
    setRotinas(data ?? [])

    const { data: ultima } = await supabase
      .from('sessions')
      .select('routine_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setUltimoTreino(ultima?.routine_id ?? null)
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

  const indiceDestaque = proximoTreino(rotinas, ultimoTreino)
  const destaque = rotinas[indiceDestaque] ?? null
  const restantes = rotinas.filter((_, i) => i !== indiceDestaque)
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
          onClick={() => navigate('/perfil')}
          aria-label="Perfil"
        >
          {inicial}
        </button>
      </header>

      <div className="home__section">
        <h2 className="home__section-title">Meus treinos</h2>
      </div>

      {carregando && (
        <>
          <Skeleton height={200} borderRadius={16} />
          <ul className="home__list">
            <li><SkeletonCard /></li>
            <li><SkeletonCard /></li>
            <li><SkeletonCard /></li>
          </ul>
        </>
      )}
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
          {restantes.map((r) => (
            <li key={r.id}>
              <Card
                to={`/rotina/${r.id}`}
                image={primeiraFoto(r.exercicios)}
                title={r.nome}
                subtitle={`${r.exercicios.length} exercícios`}
                trailing={<span className="card__chev" aria-hidden="true">›</span>}
              />
            </li>
          ))}
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
