/**
 * Valores de domínio da tarefa.
 *
 * Constante única, como `ROLES`: o schema Mongoose e os schemas Zod leem
 * daqui. Um valor escrito à mão em um dos dois aceitaria no payload o que o
 * banco recusa, ou o contrário.
 */
export const TASK_STATUS = Object.freeze({
  OPEN: 'open',
  DONE: 'done',
})

/** Valores aceitos em `Task.status`, no corpo e no filtro da listagem. */
export const TASK_STATUS_VALUES = Object.freeze(Object.values(TASK_STATUS))

export const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
})

/** Valores aceitos em `Task.priority`, no corpo e no filtro da listagem. */
export const TASK_PRIORITY_VALUES = Object.freeze(Object.values(TASK_PRIORITY))
