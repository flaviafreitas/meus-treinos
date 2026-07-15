import { useEffect, useState } from 'react'

function segundoQuadro(url) {
  if (!url || !url.includes('free-exercise-db')) return null
  if (!/\/0\.jpg$/i.test(url)) return null
  return url.replace(/\/0\.jpg$/i, '/1.jpg')
}

export default function ExercicioDetalhe({ exercicio }) {
  const [frames, setFrames] = useState([])
  const [i, setI] = useState(0)

  useEffect(() => {
    setI(0)
    const base = exercicio?.foto_url
    setFrames(base ? [base] : [])
    const seg = segundoQuadro(base)
    if (!seg) return
    const img = new Image()
    img.onload = () => setFrames([base, seg])
    img.src = seg
  }, [exercicio])

  useEffect(() => {
    if (frames.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % frames.length), 800)
    return () => clearInterval(t)
  }, [frames])

  if (!exercicio) return null
  const animando = frames.length > 1

  return (
    <div className="single">
      <div className="single__media">
        {frames.length ? (
          <img className="single__img" src={frames[i]} alt={exercicio.nome} />
        ) : (
          <div className="single__img single__img--empty">💪</div>
        )}
        {animando && <span className="single__badge">animação</span>}
      </div>

      {(exercicio.series || exercicio.repeticoes) && (
        <div className="single__stats">
          {exercicio.series ? (
            <div className="single__stat">
              <span className="single__stat-value">{exercicio.series}</span>
              <span className="single__stat-label">séries</span>
            </div>
          ) : null}
          {exercicio.repeticoes ? (
            <div className="single__stat">
              <span className="single__stat-value">{exercicio.repeticoes}</span>
              <span className="single__stat-label">reps</span>
            </div>
          ) : null}
        </div>
      )}

      {exercicio.observacoes && (
        <div className="single__notes">
          <span className="single__notes-title">Observações</span>
          <p className="single__notes-text">{exercicio.observacoes}</p>
        </div>
      )}
    </div>
  )
}
