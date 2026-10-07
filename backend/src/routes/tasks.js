import { Router } from 'express'

import { create } from '../controllers/taskController.js'
import { requireAuth } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { createTaskSchema } from '../validators/task.js'

/**
 * Rotas de tarefa. Definição e middleware, nenhuma lógica.
 *
 * Toda rota de tarefa exige token: `requireAuth` entra no router inteiro, e
 * uma rota nova não tem como nascer sem ele. Nenhuma rota é exclusiva de um
 * perfil — o que o `lead` alcança a mais é escopo, decidido no service, e não
 * permissão de rota.
 */
export const taskRouter = Router()

taskRouter.use(requireAuth)

taskRouter.post('/', validateBody(createTaskSchema), create)
