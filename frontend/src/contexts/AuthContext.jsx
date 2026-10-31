import { createContext, useCallback, useEffect, useState } from 'react'

import { setUnauthorizedHandler } from '../services/api.js'
import * as authService from '../services/authService.js'
import { tokenStorage } from '../utils/tokenStorage.js'

export const AuthContext = createContext(null)

/**
 * Sessão do usuário. O token fica no navegador, por `tokenStorage`; o
 * usuário, só em memória, como a API o devolveu.
 *
 * `login` rejeita com o `ApiError` da API, para a tela mostrar o `message`.
 * `logout` só encerra a sessão, sem navegar: quem leva ao /login é quem chama
 * ou, quando a sessão cai por um 401, o `ProtectedRoute`, ao ver `user` vazio.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Com token guardado, a sessão só vale depois de a API confirmar o usuário.
  const [isRestoring, setIsRestoring] = useState(() => tokenStorage.get() !== null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // Página recarregada: o token guardado precisa de um usuário. Sem a
  // confirmação da API, não há sessão. Token recusado volta 401, e quem apaga
  // o token é o handler acima, que o `request` só chama se o token recusado
  // ainda for o guardado; outra falha, como servidor fora, deixa o token para
  // a próxima carga.
  useEffect(() => {
    if (!tokenStorage.get()) return
    authService
      .getMe()
      .then(setUser)
      .catch(() => {})
      .finally(() => setIsRestoring(false))
  }, [])

  async function login(credentials) {
    const session = await authService.login(credentials)
    tokenStorage.set(session.token)
    setUser(session.user)
  }

  return <AuthContext value={{ user, isRestoring, login, logout }}>{children}</AuthContext>
}
