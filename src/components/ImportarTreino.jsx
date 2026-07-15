import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PROMPT_COMPLETO, analisarTexto, importarRotinas } from '../lib/importarTreino'

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
      setOk(
        `Pronto! ${resumo.rotinas} rotina(s) e ${resumo.exercicios} exercício(s) importados. 💪`
      )
      setTexto('')
      onImportado?.()
    } catch (e) {
      setErro(e.message)
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="importar">
      <ol className="importar__passos">
        <li>Copie a instrução abaixo e cole numa conversa no ChatGPT (o grátis serve).</li>
        <li>Converse sobre o treino que você quer. Quando gostar, escreva <strong>“pode montar”</strong>.</li>
        <li>Copie a resposta do ChatGPT, cole aqui embaixo e toque em <strong>Importar</strong>.</li>
      </ol>

      <button type="button" className="btn btn--outline" onClick={copiarPrompt}>
        {copiado ? '✓ Copiado!' : '📋 Copiar instrução pro ChatGPT'}
      </button>

      <details className="importar__ver">
        <summary>ver a instrução (inclui a lista de exercícios)</summary>
        <pre className="importar__prompt">{PROMPT_COMPLETO}</pre>
      </details>

      <label className="campo">
        <span>Resposta do ChatGPT</span>
        <textarea
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
