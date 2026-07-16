import { useMemo, useState } from 'react'
import biblioteca from '../data/exercicios.json'

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

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
    <>
      <div className="search">
        <span className="search__icon"><IconSearch /></span>
        <input
          className="search__input"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar exercício…"
        />
      </div>

      <div className="picker__filters">
        {grupos.map((g) => (
          <button
            key={g}
            type="button"
            className={`picker__filter${g === grupo ? ' picker__filter--active' : ''}`}
            onClick={() => setGrupo(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="picker__list">
        {visiveis.map((e) => (
          <li key={e.id} className="picker__item">
            <img className="picker__thumb" src={e.imagem} alt="" loading="lazy" />
            <div className="picker__info">
              <span className="picker__name">{e.nome}</span>
              <span className="picker__group">{e.grupo}</span>
            </div>
            <button
              type="button"
              className="picker__add"
              onClick={() => onEscolher(e)}
              aria-label={`Adicionar ${e.nome}`}
            >
              <IconPlus />
            </button>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li className="picker__empty">Nenhum exercício encontrado.</li>
        )}
        {filtrados.length > LIMITE && (
          <li className="picker__empty">
            Mostrando {LIMITE} de {filtrados.length}. Refine a busca ou filtre por grupo.
          </li>
        )}
      </ul>
    </>
  )
}
