import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      Sem transição, a troca de rota tem a mesma prioridade que a troca de
      sessão. Com ela, sair renderizava primeiro a sessão vazia na rota antiga,
      e o ProtectedRoute guardava essa rota como destino do próximo login.
    */}
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
