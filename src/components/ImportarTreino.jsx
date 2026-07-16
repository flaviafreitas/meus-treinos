import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PROMPT_COMPLETO, analisarTexto, importarRotinas } from '../lib/importarTreino'

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="4" width="8" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ImportarTreino({ onImportado }) {
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [importando, setImportando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  async function copiarPrompt() {
    try {
      await navigator.clipboard.writeText(PROMPT_COMPLETO)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErro('Não consegui copiar automaticamente. Selecione o texto abaixo e copie manualmente.')
    }
  }

  async function importar() {
    setErro('')
    setOk('')
    let rotinas
    try {
      rotinas = analisarTexto(texto)
    } catch (e) {
      setErro(e.message)
      return
    }
    setImportando(true)
    try {
      const resumo = await importarRotinas(rotinas, user.id)
      setOk(`Pronto! ${resumo.rotinas} rotina(s) e ${resumo.exercicios} exercício(s) importados.`)
      setTexto('')
      onImportado?.()
    } catch (e) {
      setErro(e.message)
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="import">
      <ol className="import__steps">
        <li className="import__step">
          <span className="import__step-num">1</span>
          <span className="import__step-text">Copie a instrução e cole numa conversa no ChatGPT (o grátis serve).</span>
        </li>
        <li className="import__step">
          <span className="import__step-num">2</span>
          <span className="import__step-text">Converse sobre o treino que você quer. Quando gostar, escreva <strong>“pode montar”</strong>.</span>
        </li>
        <li className="import__step">
          <span className="import__step-num">3</span>
          <span className="import__step-text">Copie a resposta do ChatGPT, cole aqui embaixo e toque em <strong>Importar</strong>.</span>
        </li>
      </ol>

      <button type="button" className="btn btn--outline-primary" onClick={copiarPrompt}>
        {copiado ? 'Copiado!' : 'Copiar instrução pro ChatGPT'}
        {copiado ? <IconCheck /> : <IconClipboard />}
      </button>

      <details className="import__reveal">
        <summary>ver a instrução (inclui a lista de exercícios)</summary>
        <pre className="import__prompt">{PROMPT_COMPLETO}</pre>
      </details>

      <label className="field">
        <span className="field__label">Resposta do ChatGPT</span>
        <textarea
          className="textarea"
          rows={7}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o que o ChatGPT respondeu (o bloco que começa com { …)"
        />
      </label>

      {erro && <p className="alerta alerta--erro">{erro}</p>}
      {ok && <p className="alerta alerta--ok">{ok}</p>}

      <button
        type="button"
        className="btn btn--primary"
        onClick={importar}
        disabled={importando || !texto.trim()}
      >
        {importando ? 'Importando…' : 'Importar treino'}
      </button>
    </div>
  )
}
