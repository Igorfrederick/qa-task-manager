import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../../hooks/useAuth.js'
import LoadingMessage from '../LoadingMessage/LoadingMessage.jsx'

/**
 * Porta única das rotas que exigem sessão. Sem sessão, leva ao /login e
 * guarda o destino, para voltar a ele depois de entrar.
 */
export default function ProtectedRoute() {
  const { user, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <LoadingMessage>Carregando sessão…</LoadingMessage>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
