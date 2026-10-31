import type { TaskPriority, TaskStatus } from '../services/TaskService'

// O que a lista mostra para cada valor do contrato, como o usuário lê na
// linha: os rótulos de frontend/src/utils/taskOptions.js e, na prioridade, o
// prefixo que frontend/src/pages/TaskListPage/TaskListItem.jsx acrescenta.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Aberta',
  done: 'Concluída',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Prioridade baixa',
  medium: 'Prioridade média',
  high: 'Prioridade alta',
}
