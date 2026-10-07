import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../../hooks/useAuth.js'
import styles from './ProtectedRoute.module.css'

/**
 * Porta única das rotas que exigem sessão. Sem sessão, leva ao /login e
 * guarda o destino, para voltar a ele depois de entrar.
 */
export default function ProtectedRoute() {
  const { user, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <p className={styles.loading}>Carregando sessão…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
