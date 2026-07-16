import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ExercicioDetalhe from '../components/ExercicioDetalhe'

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Workout() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [routine, setRoutine] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('active')
  const saved = useRef(false)

  const firstName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Atleta'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: rot } = await supabase
        .from('rotinas')
        .select('id, nome')
        .eq('id', id)
        .single()
      setRoutine(rot ?? null)

      let { data: exs, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('rotina_id', id)
        .order('posicao', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (error) {
        ;({ data: exs } = await supabase
          .from('exercicios')
          .select('*')
          .eq('rotina_id', id)
          .order('created_at', { ascending: true }))
      }
      setExercises(exs ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  const total = exercises.length
  const current = exercises[index]

  async function finish() {
    setPhase('done')
    if (saved.current) return
    saved.current = true
    const sets = exercises.reduce((sum, ex) => sum + (Number(ex.series) || 0), 0)
    await supabase.from('sessions').insert({
      user_id: user.id,
      routine_id: id,
      routine_name: routine?.nome ?? 'Treino',
      exercises: total,
      sets,
    })
  }

  function next() {
    if (index < total - 1) setIndex((i) => i + 1)
    else finish()
  }

  if (loading) {
    return (
      <div className="tela-carregando">
        <span className="spinner" /> Carregando…
      </div>
    )
  }

  if (!total) {
    return (
      <div className="workout">
        <div className="workout__top">
          <button type="button" className="workout__close" onClick={() => navigate(`/rotina/${id}`)} aria-label="Fechar">
            <IconClose />
          </button>
        </div>
        <p className="workout__title">Sem exercícios</p>
        <div className="workout__footer">
          <button type="button" className="btn btn--primary" onClick={() => navigate(`/rotina/${id}`)}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const sets = exercises.reduce((sum, ex) => sum + (Number(ex.series) || 0), 0)
    return (
      <div className="done">
        <div className="done__main">
          <span className="done__check"><IconCheck /></span>
          <h1 className="done__title">Treino concluído!</h1>
          <p className="done__subtitle">Boa, {firstName}! Mais um treino na conta.</p>
          <div className="done__stats">
            <div className="done__stat">
              <span className="done__stat-value">{total}</span>
              <span className="done__stat-label">exercícios</span>
            </div>
            <div className="done__stat">
              <span className="done__stat-value">{sets}</span>
              <span className="done__stat-label">séries</span>
            </div>
          </div>
        </div>
        <div className="done__footer">
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            Finalizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="workout">
      <div className="workout__top">
        <button type="button" className="workout__close" onClick={() => navigate(`/rotina/${id}`)} aria-label="Fechar">
          <IconClose />
        </button>
        <span className="workout__count">{index + 1} / {total}</span>
      </div>

      <div className="workout__progress">
        <div className="workout__progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <h1 className="workout__title">{current.nome}</h1>

      <div className="workout__body">
        <ExercicioDetalhe exercicio={current} />
      </div>

      <div className="workout__footer">
        <button type="button" className="btn btn--primary" onClick={next}>
          {index < total - 1 ? 'Concluir exercício' : 'Concluir treino'}
        </button>
      </div>
    </div>
  )
}
