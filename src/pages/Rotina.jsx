import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, FOTOS_BUCKET } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import BibliotecaExercicios from '../components/BibliotecaExercicios'
import ExercicioDetalhe from '../components/ExercicioDetalhe'

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
  const [etapa, setEtapa] = useState('escolher') // 'escolher' | 'detalhes'
  const [verEx, setVerEx] = useState(null) // exercício aberto na tela single
  const [arrastandoId, setArrastandoId] = useState(null) // exercício sendo arrastado

  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeRascunho, setNomeRascunho] = useState('')
  const [salvandoNome, setSalvandoNome] = useState(false)

  // Espelho da lista para acessar a ordem mais recente ao soltar (sem stale closure).
  const exerciciosRef = useRef([])
  const itemRefs = useRef({}) // elementos <li> para medir posições durante o arraste
  useEffect(() => {
    exerciciosRef.current = exercicios
  }, [exercicios])

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data: rot } = await supabase
      .from('rotinas')
      .select('id, nome')
      .eq('id', id)
      .single()
    setRotina(rot ?? null)

    let { data: exs, error } = await supabase
      .from('exercicios')
      .select('*')
      .eq('rotina_id', id)
      .order('posicao', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    // Fallback caso a coluna "posicao" ainda não exista no banco.
    if (error) {
      ;({ data: exs, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('rotina_id', id)
        .order('created_at', { ascending: true }))
    }
    if (error) setErro(error.message)
    else setExercicios(exs ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function abrirNome() {
    setNomeRascunho(rotina?.nome ?? '')
    setEditandoNome(true)
  }

  async function salvarNome(e) {
    e.preventDefault()
    const nome = nomeRascunho.trim()
    if (!nome || nome === rotina?.nome) {
      setEditandoNome(false)
      return
    }
    setSalvandoNome(true)
    setErro('')
    const { error } = await supabase.from('rotinas').update({ nome }).eq('id', id)
    setSalvandoNome(false)
    if (error) {
      setErro(error.message)
      return
    }
    setRotina((r) => ({ ...r, nome }))
    setEditandoNome(false)
  }

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setArquivoFoto(null)
    setPreviewFoto('')
    setEtapa('escolher') // padrão: escolher da biblioteca
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
    setEtapa('detalhes') // edição vai direto aos campos
    setModalAberto(true)
  }

  function escolherDaBiblioteca(item) {
    // Preenche nome e usa a foto da biblioteca (URL direta, sem upload).
    setForm((f) => ({ ...f, nome: item.nome }))
    setArquivoFoto(null)
    setPreviewFoto(item.imagem)
    setEtapa('detalhes')
  }

  function criarDoZero() {
    setForm(FORM_VAZIO)
    setArquivoFoto(null)
    setPreviewFoto('')
    setEtapa('detalhes')
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
          .insert({
            ...registro,
            rotina_id: id,
            user_id: user.id,
            posicao: exercicios.length,
          })
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

  // ---- Reordenar exercícios (arrastar e soltar) ----
  function aoPegar(e, ex) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setArrastandoId(ex.id)
  }

  function aoMover(e) {
    if (!arrastandoId) return
    const y = e.clientY
    setExercicios((prev) => {
      const de = prev.findIndex((x) => x.id === arrastandoId)
      if (de === -1) return prev
      // Índice de destino = nº de cards (fora o arrastado) com o meio acima do ponteiro.
      let para = 0
      for (const item of prev) {
        if (item.id === arrastandoId) continue
        const el = itemRefs.current[item.id]
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (y > r.top + r.height / 2) para++
      }
      if (para === de) return prev
      const arr = [...prev]
      const [movido] = arr.splice(de, 1)
      arr.splice(para, 0, movido)
      return arr
    })
  }

  async function aoSoltar(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    if (!arrastandoId) return
    setArrastandoId(null)

    const lista = exerciciosRef.current
    const mudaram = lista
      .map((ex, i) => ({ ex, i }))
      .filter(({ ex, i }) => ex.posicao !== i)
    if (mudaram.length === 0) return

    setExercicios((prev) => prev.map((ex, i) => ({ ...ex, posicao: i })))
    const resultados = await Promise.all(
      mudaram.map(({ ex, i }) =>
        supabase.from('exercicios').update({ posicao: i }).eq('id', ex.id),
      ),
    )
    const falha = resultados.find((r) => r.error)
    if (falha) {
      setErro(falha.error.message)
      carregar()
    }
  }

  return (
    <div className="pagina">
      <header className="cabecalho">
        <Link to="/" className="btn btn--fantasma btn--pequeno">← Voltar</Link>
        {editandoNome ? (
          <form className="editar-nome" onSubmit={salvarNome}>
            <input
              className="editar-nome__campo"
              value={nomeRascunho}
              onChange={(e) => setNomeRascunho(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditandoNome(false)
              }}
              aria-label="Nome do treino"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn--primario btn--pequeno"
              disabled={salvandoNome}
              aria-label="Salvar nome"
            >
              ✓
            </button>
            <button
              type="button"
              className="btn btn--fantasma btn--pequeno"
              onClick={() => setEditandoNome(false)}
              aria-label="Cancelar"
            >
              ✕
            </button>
          </form>
        ) : (
          <>
            <h1 className="cabecalho__titulo">{rotina?.nome ?? 'Rotina'}</h1>
            <div className="cabecalho__acoes">
              <button
                type="button"
                onClick={abrirNome}
                disabled={!rotina}
                aria-label="Editar nome do treino"
              >
                ✏️
              </button>
            </div>
          </>
        )}
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
            <li
              key={ex.id}
              ref={(el) => {
                itemRefs.current[ex.id] = el
              }}
              className={`card-ex${arrastandoId === ex.id ? ' card-ex--arrastando' : ''}`}
            >
              <button
                type="button"
                className="card-ex__arrastar"
                aria-label="Reordenar exercício"
                onPointerDown={(e) => aoPegar(e, ex)}
                onPointerMove={aoMover}
                onPointerUp={aoSoltar}
                onPointerCancel={aoSoltar}
              >
                ⠿
              </button>
              <button type="button" className="card-ex__abrir" onClick={() => setVerEx(ex)}>
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
              </button>
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
        titulo={
          etapa === 'escolher'
            ? 'Adicionar exercício'
            : editando
              ? 'Editar exercício'
              : 'Novo exercício'
        }
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {etapa === 'escolher' ? (
          <div className="escolher-ex">
            <BibliotecaExercicios onEscolher={escolherDaBiblioteca} />
            <div className="escolher-ex__ou">
              <span>não achou? </span>
            </div>
            <button
              type="button"
              className="btn btn--fantasma escolher-ex__criar"
              onClick={criarDoZero}
            >
              ✏️ Criar exercício do zero
            </button>
          </div>
        ) : (
          <form onSubmit={salvar} className="form">
            {!editando && (
              <button
                type="button"
                className="btn btn--fantasma btn--pequeno voltar-bib"
                onClick={() => setEtapa('escolher')}
              >
                ← Escolher da biblioteca
              </button>
            )}

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
        )}
      </Modal>

      <Modal titulo={verEx?.nome ?? ''} aberto={!!verEx} onFechar={() => setVerEx(null)}>
        <ExercicioDetalhe exercicio={verEx} />
      </Modal>
    </div>
  )
}
