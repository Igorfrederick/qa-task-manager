import { AppError } from '../utils/errors.js'
import { verifyToken } from '../utils/token.js'

/**
 * Exige token válido no header `Authorization: Bearer <token>`.
 *
 * Coloca em `req.user` o usuário autenticado — `{ id, role }`, lidos do token,
 * sem consultar o banco. É isso que o controller repassa ao service, que
 * nunca recebe `req`. A validação do token acontece só aqui: controller e
 * service não a repetem.
 */
export function requireAuth(req, _res, next) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('TOKEN_MISSING'))
  }

  try {
    req.user = verifyToken(token)
  } catch (error) {
    return next(error)
  }

  next()
}
