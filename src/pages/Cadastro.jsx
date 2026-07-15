import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { traduzErroAuth } from '../lib/erros'
import AuthShell from '../components/AuthShell'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    })
    if (error) {
      setErro(traduzErroAuth(error.message))
    } else if (!data.session) {
      setAviso('Conta criada! Confira seu e-mail para confirmar e depois entre.')
    }
    setCarregando(false)
  }

  return (
    <AuthShell>
      <form className="auth__form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nome</span>
          <input
            className="input"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
            placeholder="Seu nome"
          />
        </label>

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
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="mínimo 6 caracteres"
          />
        </label>

        {erro && <p className="auth__feedback auth__feedback--error">{erro}</p>}
        {aviso && <p className="auth__feedback auth__feedback--ok">{aviso}</p>}

        <button type="submit" className="btn btn--primary" disabled={carregando}>
          {carregando ? '…' : 'Criar conta'}
        </button>
      </form>

      <p className="auth__foot">
        Já tem conta? <Link to="/login" className="auth__link">Entrar</Link>
      </p>
    </AuthShell>
  )
}
