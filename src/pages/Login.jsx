import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { traduzErroAuth } from '../lib/erros'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(traduzErroAuth(error.message))
      setCarregando(false)
    }
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

        <label className="field">
          <span className="field__label">Senha</span>
          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
            minLength={6}
            placeholder="••••••••"
          />
        </label>

        <Link to="/esqueceu-senha" className="auth__forgot">Esqueceu a senha?</Link>

        {erro && <p className="auth__feedback auth__feedback--error">{erro}</p>}

        <button type="submit" className="btn btn--primary" disabled={carregando}>
          {carregando ? '…' : 'Entrar'}
        </button>
      </form>

      <p className="auth__foot">
        Não tem conta? <Link to="/cadastro" className="auth__link">Criar conta</Link>
      </p>
    </AuthShell>
  )
}
