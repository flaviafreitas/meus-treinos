import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, FOTOS_BUCKET } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import BibliotecaExercicios from '../components/BibliotecaExercicios'
import ExercicioDetalhe from '../components/ExercicioDetalhe'
import TabBar from '../components/TabBar'
import Card from '../components/Card'

const FORM_VAZIO = { nome: '', series: '', repeticoes: '', observacoes: '' }

function IconVoltar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEditar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLixeira() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMais() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Rotina() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

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

  const [modoEdicao, setModoEdicao] = useState(false)
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

  function entrarEdicao() {
    setNomeRascunho(rotina?.nome ?? '')
    setModoEdicao(true)
  }

  async function concluirEdicao() {
    const nome = nomeRascunho.trim()
    if (nome && nome !== rotina?.nome) {
      setSalvandoNome(true)
      setErro('')
      const { error } = await supabase.from('rotinas').update({ nome }).eq('id', id)
      setSalvandoNome(false)
      if (error) {
        setErro(error.message)
        return
      }
      setRotina((r) => ({ ...r, nome }))
    }
    setModoEdicao(false)
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

  async function excluirRotina() {
    if (!confirm(`Excluir a rotina "${rotina?.nome ?? ''}" e todos os exercícios?`)) return
    await supabase.from('rotinas').delete().eq('id', id)
    navigate('/')
  }

  function iniciarTreino() {
    if (exercicios.length) navigate(`/workout/${id}`)
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
    <div className="detail">
      <header className="detail__header">
        <Link to="/" className="detail__back" aria-label="Voltar"><IconVoltar /></Link>
        {modoEdicao ? (
          <input
            className="input detail__title-input"
            value={nomeRascunho}
            onChange={(e) => setNomeRascunho(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') concluirEdicao() }}
            aria-label="Nome do treino"
            autoFocus
          />
        ) : (
          <h1 className="detail__title">{rotina?.nome ?? 'Rotina'}</h1>
        )}
        {modoEdicao ? (
          <button type="button" className="detail__done" onClick={concluirEdicao} disabled={salvandoNome}>
            Concluir
          </button>
        ) : (
          <button type="button" className="detail__edit" onClick={entrarEdicao} disabled={!rotina} aria-label="Editar treino">
            <IconEditar />
          </button>
        )}
      </header>

      <div className="detail__tags">
        <span className="detail__tag">{exercicios.length} exercícios</span>
      </div>

      {carregando && <p className="detail__empty">Carregando…</p>}
      {erro && <p className="alerta alerta--erro">{erro}</p>}
      {!carregando && exercicios.length === 0 && !erro && (
        <p className="detail__empty">Nenhum exercício ainda. Toque em “Adicionar exercício”.</p>
      )}

      <ul className="detail__list">
        {exercicios.map((ex) => (
          <li key={ex.id}>
            <Card
              innerRef={(el) => { itemRefs.current[ex.id] = el }}
              dragging={arrastandoId === ex.id}
              image={ex.foto_url}
              title={ex.nome}
              subtitle={
                (ex.series || ex.repeticoes) ? (
                  <div className="card__stats">
                    {ex.series ? <span className="card__stat">{ex.series} séries</span> : null}
                    {ex.repeticoes ? <span className="card__stat">{ex.repeticoes} reps</span> : null}
                  </div>
                ) : null
              }
              onClick={() => setVerEx(ex)}
              leading={
                modoEdicao ? (
                  <button
                    type="button"
                    className="card__drag"
                    aria-label="Reordenar exercício"
                    onPointerDown={(e) => aoPegar(e, ex)}
                    onPointerMove={aoMover}
                    onPointerUp={aoSoltar}
                    onPointerCancel={aoSoltar}
                  >
                    ⠿
                  </button>
                ) : null
              }
              trailing={
                modoEdicao ? (
                  <button type="button" className="card__action" onClick={() => excluir(ex)} aria-label="Excluir exercício">
                    <IconLixeira />
                  </button>
                ) : null
              }
            />
          </li>
        ))}
      </ul>

      <div className="detail__add">
        <button type="button" className="btn btn--text" onClick={abrirNovo}>
          Adicionar exercício <IconMais />
        </button>
      </div>

      <div className="detail__bottom">
        {modoEdicao ? (
          rotina && (
            <button type="button" className="detail__danger" onClick={excluirRotina}>Excluir rotina</button>
          )
        ) : (
          <button type="button" className="btn btn--primary" onClick={iniciarTreino} disabled={!exercicios.length}>
            Iniciar treino
          </button>
        )}
      </div>

      <TabBar active="inicio" />

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
          <div className="picker">
            <BibliotecaExercicios onEscolher={escolherDaBiblioteca} />
            <button type="button" className="btn btn--outline" onClick={criarDoZero}>
              <IconEditar /> Criar exercício do zero
            </button>
          </div>
        ) : (
          <form onSubmit={salvar} className="ex-form">
            {!editando && (
              <button type="button" className="ex-form__back" onClick={() => setEtapa('escolher')}>
                <IconVoltar /> Escolher da biblioteca
              </button>
            )}

            <div className="ex-form__photo">
              {previewFoto ? (
                <img src={previewFoto} alt="" className="ex-form__img" />
              ) : (
                <div className="ex-form__img ex-form__img--empty">💪</div>
              )}
              <label className="ex-form__photo-btn">
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

            <label className="field">
              <span className="field__label">Exercício</span>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Supino reto com barra"
                autoFocus
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Séries</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={form.series}
                  onChange={(e) => setForm({ ...form, series: e.target.value })}
                  placeholder="Ex: 4"
                />
              </label>
              <label className="field">
                <span className="field__label">Repetições</span>
                <input
                  className="input"
                  value={form.repeticoes}
                  onChange={(e) => setForm({ ...form, repeticoes: e.target.value })}
                  placeholder="Ex: 8-12"
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Observações</span>
              <textarea
                className="textarea"
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Ex: descanso de 90s, foco na fase negativa…"
              />
            </label>

            {erro && <p className="alerta alerta--erro">{erro}</p>}

            <button type="submit" className="btn btn--primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar exercício'}
            </button>
          </form>
        )}
      </Modal>

      <Modal titulo={verEx?.nome ?? ''} aberto={!!verEx} onFechar={() => setVerEx(null)}>
        <ExercicioDetalhe exercicio={verEx} />
        <button
          type="button"
          className="btn btn--outline detail__ver-editar"
          onClick={() => { const ex = verEx; setVerEx(null); abrirEdicao(ex) }}
        >
          Editar exercício
        </button>
      </Modal>
    </div>
  )
}
