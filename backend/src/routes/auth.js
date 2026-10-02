import { Router } from 'express'

import { register } from '../controllers/authController.js'
import { validateBody } from '../middlewares/validate.js'
import { registerSchema } from '../validators/auth.js'

/**
 * Rotas de autenticação. Definição e middleware, nenhuma lógica.
 *
 * `POST /auth/login` e `GET /auth/me` são os commits seguintes.
 */
export const authRouter = Router()

authRouter.post('/register', validateBody(registerSchema), register)
