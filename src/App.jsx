import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import EsqueceuSenha from './pages/EsqueceuSenha'
import Rotinas from './pages/Rotinas'
import Rotina from './pages/Rotina'
import Workout from './pages/Workout'

function Protegido({ children }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="tela-carregando">
        <span className="spinner" /> Carregando…
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/cadastro"
        element={session ? <Navigate to="/" replace /> : <Cadastro />}
      />
      <Route
        path="/esqueceu-senha"
        element={session ? <Navigate to="/" replace /> : <EsqueceuSenha />}
      />
      <Route
        path="/"
        element={
          <Protegido>
            <Rotinas />
          </Protegido>
        }
      />
      <Route
        path="/rotina/:id"
        element={
          <Protegido>
            <Rotina />
          </Protegido>
        }
      />
      <Route
        path="/workout/:id"
        element={
          <Protegido>
            <Workout />
          </Protegido>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
