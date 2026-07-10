import { useEffect, useState } from 'react'

// As imagens da free-exercise-db vêm em dois quadros: .../0.jpg (início) e
// .../1.jpg (fim). A partir do 1º quadro dá pra derivar o 2º e animar o movimento.
function segundoQuadro(url) {
  if (!url || !url.includes('free-exercise-db')) return null
  if (!/\/0\.jpg$/i.test(url)) return null
  return url.replace(/\/0\.jpg$/i, '/1.jpg')
}

export default function ExercicioDetalhe({ exercicio }) {
  const [frames, setFrames] = useState([])
  const [i, setI] = useState(0)

  // Monta os quadros: começa só com a foto atual e adiciona o 2º se ele existir.
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

  // Alterna os quadros = efeito "gif" de 2 frames (início ↔ fim).
  useEffect(() => {
    if (frames.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % frames.length), 800)
    return () => clearInterval(t)
  }, [frames])

  if (!exercicio) return null
  const animando = frames.length > 1

  return (
    <div className="single">
      <div className="single__midia">
        {frames.length ? (
          <img className="single__foto" src={frames[i]} alt={exercicio.nome} />
        ) : (
          <div className="single__foto single__foto--vazia">💪</div>
        )}
        {animando && <span className="single__badge">animação ▶</span>}
      </div>

      {(exercicio.series || exercicio.repeticoes) && (
        <div className="single__nums">
          {exercicio.series ? <span>{exercicio.series} séries</span> : null}
          {exercicio.repeticoes ? <span>{exercicio.repeticoes} reps</span> : null}
        </div>
      )}

      {exercicio.observacoes && <p className="single__obs">{exercicio.observacoes}</p>}
    </div>
  )
}
