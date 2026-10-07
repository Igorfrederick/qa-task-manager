import { z } from 'zod'

import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from '../utils/taskEnums.js'
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from '../utils/taskLimits.js'

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
    .max(TASK_TITLE_MAX_LENGTH, `O título pode ter no máximo ${TASK_TITLE_MAX_LENGTH} caracteres`),
  description: z
    .string({ invalid_type_error: 'A descrição precisa ser texto' })
    .max(
      TASK_DESCRIPTION_MAX_LENGTH,
      `A descrição pode ter no máximo ${TASK_DESCRIPTION_MAX_LENGTH} caracteres`,
    )
    .optional(),
  status: status.optional(),
  priority: priority.optional(),
})

/**
 * Edição parcial: os mesmos campos e as mesmas regras da criação, todos
 * opcionais. Concluir ou reabrir envia só o `status`. Os padrões estão no
 * model, não aqui: campo ausente na edição fica como está.
 */
export const updateTaskSchema = createTaskSchema.partial()

/**
 * `:id` das rotas de uma tarefa. Id fora do formato se julga olhando só a
 * entrada: é invariante de entrada, `400` com `id` em `details` — nunca o
 * `500` do `CastError` que o Mongoose lançaria na consulta.
 */
export const taskIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, 'Identificador de tarefa inválido'),
})

/**
 * Filtros da listagem, com os mesmos valores do corpo. Filtro fora do domínio
 * é `400`: uma lista vazia esconderia de quem chamou que o filtro estava
 * errado.
 */
export const listTasksQuerySchema = z.object({
  status: status.optional(),
  priority: priority.optional(),
})
