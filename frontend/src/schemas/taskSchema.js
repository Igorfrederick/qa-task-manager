import { z } from 'zod'

import { PRIORITY_VALUES } from '../utils/taskOptions.js'

const TITLE_MAX_LENGTH = 120
const DESCRIPTION_MAX_LENGTH = 2000

/**
 * Formulário de tarefa, com os mesmos limites e mensagens do schema de
 * criação da API. O status não está aqui: concluir e reabrir são ações da
 * lista.
 */
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título')
    .max(TITLE_MAX_LENGTH, `O título pode ter no máximo ${TITLE_MAX_LENGTH} caracteres`),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `A descrição pode ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`),
  priority: z.enum(PRIORITY_VALUES, { errorMap: () => ({ message: 'Prioridade inválida' }) }),
})

export const TASK_FORM_FIELDS = Object.keys(taskSchema.shape)
