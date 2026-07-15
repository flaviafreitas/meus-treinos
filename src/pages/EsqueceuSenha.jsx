import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { traduzErroAuth } from '../lib/erros'
import AuthShell from '../components/AuthShell'

export default function EsqueceuSenha() {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/meus-treinos/`,
    })
    if (error) {
      setErro(traduzErroAuth(error.message))
    } else {
      setAviso('Enviamos um link de recuperação pro seu e-mail.')
    }
    setCarregando(false)
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">E-mail</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="voce@email.com"
          />
        </label>

        {erro && <p className="auth__feedback auth__feedback--error">{erro}</p>}
        {aviso && <p className="auth__feedback auth__feedback--ok">{aviso}</p>}

        <button type="submit" className="btn btn--primary" disabled={carregando}>
          {carregando ? '…' : 'Enviar link'}
        </button>
      </form>

      <p className="auth__foot">
        <Link to="/login" className="auth__link">Voltar pro login</Link>
      </p>
    </AuthShell>
  )
}
