import { Router } from 'express'

import { login, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { loginSchema, registerSchema } from '../validators/auth.js'

/**
 * Rotas de autenticação. Definição e middleware, nenhuma lógica.
 */
export const authRouter = Router()

authRouter.post('/register', validateBody(registerSchema), register)
authRouter.post('/login', validateBody(loginSchema), login)
authRouter.get('/me', requireAuth, me)
