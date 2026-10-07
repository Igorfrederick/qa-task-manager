import { Router } from 'express'

import { authRouter } from './auth.js'
import { taskRouter } from './tasks.js'

/**
 * Raiz do roteamento sob `/api`. Cada frente do contrato entra aqui como um
 * router próprio, montado no seu prefixo.
 */
export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/tasks', taskRouter)
