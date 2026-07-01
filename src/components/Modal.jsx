import { useEffect } from 'react'

export default function Modal({ titulo, aberto, onFechar, children }) {
  useEffect(() => {
    if (!aberto) return
    function onKey(e) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="modal" onMouseDown={onFechar}>
      <div
        className="modal__caixa"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__topo">
          <h2>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="modal__corpo">{children}</div>
      </div>
    </div>
  )
}
