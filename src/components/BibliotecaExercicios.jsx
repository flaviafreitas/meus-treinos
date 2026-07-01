import { useMemo, useState } from 'react'
import biblioteca from '../data/exercicios.json'

export default function BibliotecaExercicios({ onEscolher }) {
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('Todos')

  const grupos = useMemo(
    () => ['Todos', ...Array.from(new Set(biblioteca.map((e) => e.grupo)))],
    []
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return biblioteca.filter((e) => {
      const okGrupo = grupo === 'Todos' || e.grupo === grupo
      const okBusca =
        !q || e.nome.toLowerCase().includes(q) || e.grupo.toLowerCase().includes(q)
      return okGrupo && okBusca
    })
  }, [busca, grupo])

  const LIMITE = 80
  const visiveis = filtrados.slice(0, LIMITE)

  return (
    <div className="biblioteca">
      <input
        className="biblioteca__busca"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="🔍 Buscar exercício (ex: supino, agachamento…)"
      />

      <div className="biblioteca__grupos">
        {grupos.map((g) => (
          <button
            key={g}
            type="button"
            className={g === grupo ? 'is-active' : ''}
            onClick={() => setGrupo(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="biblioteca__lista">
        {visiveis.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onEscolher(e)}>
              <img src={e.imagem} alt={e.nome} loading="lazy" />
              <span className="biblioteca__nome">{e.nome}</span>
              <span className="biblioteca__grupo">{e.grupo}</span>
            </button>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li className="biblioteca__vazio">Nenhum exercício encontrado.</li>
        )}
        {filtrados.length > LIMITE && (
          <li className="biblioteca__vazio">
            Mostrando {LIMITE} de {filtrados.length}. Refine a busca ou filtre por grupo. 🔍
          </li>
        )}
      </ul>
    </div>
  )
}
