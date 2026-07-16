import { useEffect, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { supabase } from '../supabaseClient'
import TabBar from '../components/TabBar'
import EmptyState from '../components/EmptyState'

const WEEK_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function IconDumbbell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function relativeDate(iso) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff <= 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return `${diff} dias atrás`
}

export default function Progress() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErro('')
      const { data, error } = await supabase
        .from('sessions')
        .select('id, routine_name, created_at')
        .order('created_at', { ascending: false })
      if (error) setErro(error.message)
      else setSessions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const { days, thisWeek, streak } = useMemo(() => {
    const trained = new Set(sessions.map((s) => dayKey(s.created_at)))
    const week = startOfWeek(new Date())
    const days = WEEK_LETTERS.map((letter, i) => {
      const d = new Date(week)
      d.setDate(week.getDate() + i)
      return { letter, on: trained.has(dayKey(d)) }
    })

    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    if (!trained.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    let streak = 0
    while (trained.has(dayKey(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }

    return { days, thisWeek: days.filter((d) => d.on).length, streak }
  }, [sessions])

  const history = sessions.slice(0, 10)

  return (
    <div className="progress">
      <h1 className="progress__title">Progresso</h1>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {loading ? (
        <>
          <div className="progress__stats">
            <Skeleton height={86} borderRadius={16} containerClassName="sk-fill" />
            <Skeleton height={86} borderRadius={16} containerClassName="sk-fill" />
          </div>
          <Skeleton height={116} borderRadius={16} />
          <div className="progress__history">
            {[0, 1].map((i) => (
              <div key={i} className="progress__item">
                <Skeleton width={40} height={40} borderRadius={12} />
                <div className="progress__item-body">
                  <Skeleton height={16} width="70%" />
                  <Skeleton height={14} width="30%" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="progress__stats">
            <div className="progress__stat">
              <span className="progress__stat-value">{thisWeek}</span>
              <span className="progress__stat-label">esta semana</span>
            </div>
            <div className="progress__stat">
              <span className="progress__stat-value">{streak}</span>
              <span className="progress__stat-label">sequência</span>
            </div>
          </div>

          <div className="progress__block">
            <h2 className="progress__label">Atividade da semana</h2>
            <div className="progress__week">
              {days.map((d, i) => (
                <div key={i} className={`progress__day${d.on ? ' progress__day--on' : ''}`}>
                  {d.letter}
                </div>
              ))}
            </div>
          </div>

          <div className="progress__block">
            <h2 className="progress__label">Histórico</h2>
            {history.length === 0 && !erro && (
              <EmptyState>Nenhum treino concluído ainda. Bora treinar!</EmptyState>
            )}
            {history.length > 0 && (
              <ul className="progress__history">
                {history.map((s) => (
                  <li key={s.id} className="progress__item">
                    <span className="progress__item-fig"><IconDumbbell /></span>
                    <div className="progress__item-body">
                      <span className="progress__item-name">{s.routine_name}</span>
                      <span className="progress__item-date">{relativeDate(s.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <TabBar active="progresso" />
    </div>
  )
}
