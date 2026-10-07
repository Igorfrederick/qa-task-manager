import { Outlet, useNavigate } from 'react-router'

import { useAuth } from '../../hooks/useAuth.js'
import Button from '../Button/Button.jsx'
import styles from './AppLayout.module.css'

/** Moldura das telas com sessão: cabeçalho com o usuário e a saída. */
export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Sair é escolha do usuário: o /login não guarda a tela de onde ele veio.
  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.brand}>Task Manager</span>
        <div className={styles.session}>
          <span className={styles.userName} data-cy="header-user-name">
            {user.name}
          </span>
          <Button variant="secondary" onClick={handleLogout} data-cy="header-logout-button">
            Sair
          </Button>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
