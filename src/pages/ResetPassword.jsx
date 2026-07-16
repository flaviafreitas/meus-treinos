import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { traduzErroAuth } from '../lib/erros'
import AuthShell from '../components/AuthShell'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { clearRecovery } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) {
      setErro('A senha precisa ter ao menos 6 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As senhas não conferem.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setCarregando(false)
    if (error) {
      setErro(traduzErroAuth(error.message))
      return
    }
    clearRecovery()
    navigate('/')
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nova senha</span>
          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
        </label>

        <label className="field">
          <span className="field__label">Confirmar senha</span>
          <input
            className="input"
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
        </label>

        {erro && <p className="auth__feedback auth__feedback--error">{erro}</p>}

        <button type="submit" className="btn btn--primary" disabled={carregando}>
          {carregando ? '…' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="auth__foot">
        <button
          type="button"
          className="auth__link"
          onClick={() => { clearRecovery(); navigate('/') }}
        >
          Agora não
        </button>
      </p>
    </AuthShell>
  )
}
