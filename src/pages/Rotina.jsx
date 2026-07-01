import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, FOTOS_BUCKET } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const FORM_VAZIO = { nome: '', series: '', repeticoes: '', observacoes: '' }

export default function Rotina() {
  const { id } = useParams()
  const { user } = useAuth()

  const [rotina, setRotina] = useState(null)
  const [exercicios, setExercicios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [arquivoFoto, setArquivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    const [{ data: rot }, { data: exs, error }] = await Promise.all([
      supabase.from('rotinas').select('id, nome').eq('id', id).single(),
      supabase
        .from('exercicios')
        .select('*')
        .eq('rotina_id', id)
        .order('created_at', { ascending: true }),
    ])
    setRotina(rot ?? null)
    if (error) setErro(error.message)
    else setExercicios(exs ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setArquivoFoto(null)
    setPreviewFoto('')
    setModalAberto(true)
  }

  function abrirEdicao(ex) {
    setEditando(ex)
    setForm({
      nome: ex.nome ?? '',
      series: ex.series ?? '',
      repeticoes: ex.repeticoes ?? '',
      observacoes: ex.observacoes ?? '',
    })
    setArquivoFoto(null)
    setPreviewFoto(ex.foto_url ?? '')
    setModalAberto(true)
  }

  function escolherFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivoFoto(file)
    setPreviewFoto(URL.createObjectURL(file))
  }

  async function enviarFoto() {
    if (!arquivoFoto) return previewFoto || null
    const ext = arquivoFoto.name.split('.').pop()
    const caminho = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(FOTOS_BUCKET)
      .upload(caminho, arquivoFoto, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(caminho)
    return data.publicUrl
  }

  async function salvar(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const foto_url = await enviarFoto()
      const registro = {
        nome: form.nome.trim(),
        series: form.series === '' ? null : Number(form.series),
        repeticoes: form.repeticoes.trim() || null,
        observacoes: form.observacoes.trim() || null,
        foto_url: foto_url || null,
      }
      if (editando) {
        await supabase.from('exercicios').update(registro).eq('id', editando.id)
      } else {
        await supabase
          .from('exercicios')
          .insert({ ...registro, rotina_id: id, user_id: user.id })
      }
      setModalAberto(false)
      carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(ex) {
    if (!confirm(`Excluir o exercício "${ex.nome}"?`)) return
    await supabase.from('exercicios').delete().eq('id', ex.id)
    carregar()
  }

  return (
    <div className="pagina">
      <header className="cabecalho">
        <Link to="/" className="btn btn--fantasma btn--pequeno">← Voltar</Link>
        <h1 className="cabecalho__titulo">{rotina?.nome ?? 'Rotina'}</h1>
      </header>

      <main className="conteudo">
        {carregando && <p className="vazio">Carregando…</p>}
        {erro && <p className="alerta alerta--erro">{erro}</p>}

        {!carregando && exercicios.length === 0 && !erro && (
          <div className="vazio">
            <p>Nenhum exercício ainda.</p>
            <p>Toque em <strong>+ Adicionar exercício</strong>. 🏋️</p>
          </div>
        )}

        <ul className="lista-exercicios">
          {exercicios.map((ex) => (
            <li key={ex.id} className="card-ex">
              {ex.foto_url ? (
                <img className="card-ex__foto" src={ex.foto_url} alt={ex.nome} loading="lazy" />
              ) : (
                <div className="card-ex__foto card-ex__foto--vazia">💪</div>
              )}
              <div className="card-ex__info">
                <h3>{ex.nome}</h3>
                <p className="card-ex__nums">
                  {ex.series ? <span>{ex.series} séries</span> : null}
                  {ex.repeticoes ? <span>{ex.repeticoes} reps</span> : null}
                </p>
                {ex.observacoes && <p className="card-ex__obs">{ex.observacoes}</p>}
              </div>
              <div className="card-ex__acoes">
                <button type="button" onClick={() => abrirEdicao(ex)} aria-label="Editar">✏️</button>
                <button type="button" onClick={() => excluir(ex)} aria-label="Excluir">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <button type="button" className="fab" onClick={abrirNovo}>
        + Adicionar exercício
      </button>

      <Modal
        titulo={editando ? 'Editar exercício' : 'Novo exercício'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="form">
          <div className="foto-upload">
            {previewFoto ? (
              <img src={previewFoto} alt="Prévia" className="foto-upload__preview" />
            ) : (
              <div className="foto-upload__vazio">Sem foto</div>
            )}
            <label className="btn btn--fantasma btn--pequeno">
              {previewFoto ? 'Trocar foto' : 'Adicionar foto'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={escolherFoto}
                hidden
              />
            </label>
          </div>

          <label className="campo">
            <span>Exercício</span>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Supino reto"
              autoFocus
              required
            />
          </label>

          <div className="campo-linha">
            <label className="campo">
              <span>Séries</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={form.series}
                onChange={(e) => setForm({ ...form, series: e.target.value })}
                placeholder="Ex: 4"
              />
            </label>
            <label className="campo">
              <span>Repetições</span>
              <input
                value={form.repeticoes}
                onChange={(e) => setForm({ ...form, repeticoes: e.target.value })}
                placeholder="Ex: 8-12"
              />
            </label>
          </div>

          <label className="campo">
            <span>Observações</span>
            <textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Ex: descanso de 60s, foco na fase negativa…"
            />
          </label>

          {erro && <p className="alerta alerta--erro">{erro}</p>}

          <button type="submit" className="btn btn--primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar exercício'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
