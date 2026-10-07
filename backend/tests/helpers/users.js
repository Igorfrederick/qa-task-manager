import { registerUser } from '../../src/services/userService.js'
import { signToken } from '../../src/utils/token.js'

/**
 * Usuário criado pelo service, com o token que o login emitiria para ele.
 *
 * Sem cadastro público, nenhuma rota cria usuário sem um `lead` que já exista:
 * os testes de rota protegida criam o usuário pelo service. O token é assinado
 * direto, sem passar pelo login — o que se testa ali é a rota protegida, e o
 * login tem os próprios testes.
 *
 * A senha é fixa porque nenhum teste que usa este helper entra com ela.
 *
 * @param {{ name: string, email: string, role: string }} data
 * @returns {Promise<{ user: import('mongoose').Document, token: string }>}
 */
export async function createUserWithToken({ name, email, role }) {
  const user = await registerUser({ name, email, role, password: 'senha-de-teste-123' })
  return { user, token: signToken(user) }
}
