import { z } from 'zod'

import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from '../utils/taskEnums.js'

/**
 * Schemas de entrada das rotas de tarefa.
 *
 * Só invariante de entrada — regra 1, o que se julga olhando apenas o payload.
 * Falha aqui é `400` com `details`. Nenhum schema declara `userId`: o dono vem
 * do token (regra 3), e o Zod descarta o campo não declarado.
 */

const status = z.enum(TASK_STATUS_VALUES, {
  errorMap: () => ({ message: 'Status inválido' }),
})

const priority = z.enum(TASK_PRIORITY_VALUES, {
  errorMap: () => ({ message: 'Prioridade inválida' }),
})

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Informe o título', invalid_type_error: 'O título precisa ser texto' })
    .trim()
    .min(1, 'Informe o título')
    .max(120, 'O título pode ter no máximo 120 caracteres'),
  description: z
    .string({ invalid_type_error: 'A descrição precisa ser texto' })
    .max(2000, 'A descrição pode ter no máximo 2000 caracteres')
    .optional(),
  status: status.optional(),
  priority: priority.optional(),
})
