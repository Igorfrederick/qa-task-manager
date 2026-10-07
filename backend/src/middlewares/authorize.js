import { AppError } from '../utils/errors.js'

/**
 * Exige um dos perfis informados.
 *
 * Roda depois do `requireAuth`, de quem recebe `req.user`. Perfil sem
 * permissão é `403` — o usuário está autenticado, mas não pode —, distinto do
 * `401` de quem não se autenticou. Os perfis vêm de `ROLES`, nunca como string
 * solta na definição da rota.
 *
 * @param {...string} roles perfis aceitos
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN'))
    }

    next()
  }
}
