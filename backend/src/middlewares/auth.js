import { getAuthenticatedUser } from '../services/userService.js'
import { AppError } from '../utils/errors.js'
import { verifyToken } from '../utils/token.js'

/**
 * Exige token válido no header `Authorization: Bearer <token>`.
 *
 * Além de validar o token, confirma no banco que o usuário dele ainda existe e
 * lê de lá o perfil. Sem isso, o mesmo token valeria numa rota e não em outra:
 * token de usuário removido seguiria autorizando até expirar, e um perfil
 * alterado só valeria no próximo login. A consulta é por `_id`, indexado.
 *
 * Coloca em `req.user` o usuário autenticado como dado — `{ id, role }` —, que
 * o controller repassa ao service, que nunca recebe `req`. A validação do
 * token acontece só aqui: controller e service não a repetem.
 */
export async function requireAuth(req, _res, next) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('TOKEN_MISSING'))
  }

  let user
  try {
    const { id } = verifyToken(token)
    user = await getAuthenticatedUser(id)
  } catch (error) {
    return next(error)
  }

  req.user = { id: user.id, role: user.role }
  next()
}
