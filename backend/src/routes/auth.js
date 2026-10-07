import { Router } from 'express'

import { login, register } from '../controllers/authController.js'
import { validateBody } from '../middlewares/validate.js'
import { loginSchema, registerSchema } from '../validators/auth.js'

/**
 * Rotas de autenticação. Definição e middleware, nenhuma lógica.
 *
 * `GET /auth/me` é o commit seguinte.
 */
export const authRouter = Router()

authRouter.post('/register', validateBody(registerSchema), register)
authRouter.post('/login', validateBody(loginSchema), login)
