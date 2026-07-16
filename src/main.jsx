import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import './styles/main.scss'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <SkeletonTheme baseColor="#23232a" highlightColor="#33333d">
          <App />
        </SkeletonTheme>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
