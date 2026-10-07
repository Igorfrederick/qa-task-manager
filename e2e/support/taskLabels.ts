import type { TaskPriority, TaskStatus } from '../services/TaskService'

// O que a lista mostra para cada valor do contrato — os rótulos de
// frontend/src/utils/taskOptions.js, como o usuário os lê na linha.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Aberta',
  done: 'Concluída',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Prioridade baixa',
  medium: 'Prioridade média',
  high: 'Prioridade alta',
}
