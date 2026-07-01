import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastrar'
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

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw error
        // Se o projeto exigir confirmação de e-mail, a sessão vem vazia.
        if (!data.session) {
          setAviso('Conta criada! Confira seu e-mail para confirmar o cadastro e depois entre.')
          setModo('entrar')
        }
      }
    } catch (err) {
      setErro(traduzErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <img src="/meus-treinos/icon.svg" alt="" width="56" height="56" />
          <h1>Meus Treinos</h1>
          <p>Suas rotinas de treino, sempre no bolso.</p>
        </div>

        <div className="segmented">
          <button
            type="button"
            className={modo === 'entrar' ? 'is-active' : ''}
            onClick={() => setModo('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={modo === 'cadastrar' ? 'is-active' : ''}
            onClick={() => setModo('cadastrar')}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="campo">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="voce@email.com"
            />
          </label>

          <label className="campo">
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
            />
          </label>

          {erro && <p className="alerta alerta--erro">{erro}</p>}
          {aviso && <p className="alerta alerta--ok">{aviso}</p>}

          <button type="submit" className="btn btn--primario" disabled={carregando}>
            {carregando ? '…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function traduzErro(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered')) return 'Este e-mail já tem conta. Tente entrar.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('supabaseurl') || m.includes('fetch')) return 'App ainda não conectado ao Supabase.'
  return msg || 'Algo deu errado. Tente de novo.'
}
