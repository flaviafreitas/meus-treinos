import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ImportarTreino from '../components/ImportarTreino'

export default function Rotinas() {
  const { user, signOut } = useAuth()
  const [rotinas, setRotinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [modalImportar, setModalImportar] = useState(false)
  const [editando, setEditando] = useState(null) // rotina em edição ou null
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase
      .from('rotinas')
      .select('id, nome, created_at, exercicios(count)')
      .order('created_at', { ascending: true })
    if (error) setErro(error.message)
    else setRotinas(data ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirNova() {
    setEditando(null)
    setNome('')
    setModalAberto(true)
  }

  function abrirEdicao(rotina) {
    setEditando(rotina)
    setNome(rotina.nome)
    setModalAberto(true)
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
    setModalAberto(false)
    carregar()
  }

  async function excluir(rotina) {
    if (!confirm(`Excluir a rotina "${rotina.nome}" e todos os seus exercícios?`)) return
    await supabase.from('rotinas').delete().eq('id', rotina.id)
    carregar()
  }

  return (
    <div className="pagina">
      <header className="cabecalho">
        <div>
          <h1>Meus Treinos</h1>
          <span className="cabecalho__sub">{user?.email}</span>
        </div>
        <div className="cabecalho__acoes">
          <button
            type="button"
            className="btn btn--fantasma btn--pequeno"
            onClick={() => setModalImportar(true)}
          >
            🤖 Montar com IA
          </button>
          <button type="button" className="btn btn--fantasma btn--pequeno" onClick={signOut}>
            Sair
          </button>
        </div>
      </header>

      <main className="conteudo">
        {carregando && <p className="vazio">Carregando rotinas…</p>}
        {erro && <p className="alerta alerta--erro">{erro}</p>}

        {!carregando && !erro && rotinas.length === 0 && (
          <div className="vazio">
            <p>Você ainda não tem nenhuma rotina.</p>
            <p>Toque em <strong>+ Nova rotina</strong> para começar. 💪</p>
          </div>
        )}

        <ul className="lista-rotinas">
          {rotinas.map((r) => (
            <li key={r.id} className="card-rotina">
              <Link to={`/rotina/${r.id}`} className="card-rotina__link">
                <span className="card-rotina__nome">{r.nome}</span>
                <span className="card-rotina__contagem">
                  {r.exercicios?.[0]?.count ?? 0} exercício(s)
                </span>
              </Link>
              <div className="card-rotina__acoes">
                <button type="button" onClick={() => abrirEdicao(r)} aria-label="Editar">✏️</button>
                <button type="button" onClick={() => excluir(r)} aria-label="Excluir">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <button type="button" className="fab" onClick={abrirNova}>
        + Nova rotina
      </button>

      <Modal
        titulo={editando ? 'Editar rotina' : 'Nova rotina'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="form">
          <label className="campo">
            <span>Nome da rotina</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Treino A - Peito e tríceps"
              autoFocus
              required
            />
          </label>
          <button type="submit" className="btn btn--primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </Modal>

      <Modal
        titulo="Montar treino com IA"
        aberto={modalImportar}
        onFechar={() => setModalImportar(false)}
      >
        <ImportarTreino onImportado={carregar} />
      </Modal>
    </div>
  )
}
