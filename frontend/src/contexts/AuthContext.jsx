import { createContext, useState } from 'react'

import * as authService from '../services/authService.js'
import { tokenStorage } from '../utils/tokenStorage.js'

export const AuthContext = createContext(null)

/**
 * Sessão do usuário. O token fica no navegador, por `tokenStorage`; o
 * usuário, só em memória, como a API o devolveu.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  async function login(credentials) {
    const session = await authService.login(credentials)
    tokenStorage.set(session.token)
    setUser(session.user)
  }

  return <AuthContext value={{ user, login }}>{children}</AuthContext>
}
