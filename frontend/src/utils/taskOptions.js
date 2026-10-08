/**
 * Valores de status e prioridade do contrato, com o rótulo de cada um na
 * interface. Fonte única para os filtros, o formulário, as etiquetas e as
 * comparações da lista: valor novo no domínio entra aqui. Os nomes seguem
 * os de backend/src/utils/taskEnums.js.
 */
export const TASK_STATUS = Object.freeze({
  OPEN: 'open',
  DONE: 'done',
})

export const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
})

export const STATUS_OPTIONS = [
  { value: TASK_STATUS.OPEN, label: 'Aberta' },
  { value: TASK_STATUS.DONE, label: 'Concluída' },
]

export const PRIORITY_OPTIONS = [
  { value: TASK_PRIORITY.LOW, label: 'Baixa' },
  { value: TASK_PRIORITY.MEDIUM, label: 'Média' },
  { value: TASK_PRIORITY.HIGH, label: 'Alta' },
]

export const STATUS_VALUES = STATUS_OPTIONS.map((option) => option.value)
export const PRIORITY_VALUES = PRIORITY_OPTIONS.map((option) => option.value)

export function labelOf(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}
