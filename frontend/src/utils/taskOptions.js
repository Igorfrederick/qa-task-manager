/**
 * Valores de status e prioridade do contrato, com o rótulo de cada um na
 * interface. Fonte única para os filtros, o formulário e as etiquetas da
 * lista: valor novo no domínio entra aqui.
 */
export const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberta' },
  { value: 'done', label: 'Concluída' },
]

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

export const STATUS_VALUES = STATUS_OPTIONS.map((option) => option.value)
export const PRIORITY_VALUES = PRIORITY_OPTIONS.map((option) => option.value)

export function labelOf(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}
