import { Router } from 'express'

import { login, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/auth.js'
import { requireRole } from '../middlewares/authorize.js'
import { validateBody } from '../middlewares/validate.js'
import { ROLES } from '../utils/roles.js'
import { loginSchema, registerSchema } from '../validators/auth.js'

/**
 * Rotas de autenticação. Definição e middleware, nenhuma lógica.
 *
 * Criar conta é exclusivo do líder: não há cadastro público. A ordem dos
 * middlewares é deliberada — autenticação, depois perfil, depois validação —,
 * para que quem não pode criar conta receba `401` ou `403` sem que o payload
 * seja sequer avaliado.
 */
export const authRouter = Router()

authRouter.post(
  '/register',
  requireAuth,
  requireRole(ROLES.LEAD),
  validateBody(registerSchema),
  register,
)
authRouter.post('/login', validateBody(loginSchema), login)
authRouter.get('/me', requireAuth, me)
