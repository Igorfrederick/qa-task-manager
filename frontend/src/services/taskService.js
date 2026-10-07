import { request } from './api.js'

/**
 * Tarefas ao alcance do usuário: as próprias para o `qa`, as do time para o
 * `lead`. Filtro vazio fica fora da query — o contrato responde 400 a
 * `?status=`, e "todos" é a ausência do parâmetro.
 */
export async function listTasks({ status, priority } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (priority) params.set('priority', priority)
  const query = params.toString()

  const { tasks } = await request(query ? `/tasks?${query}` : '/tasks')
  return tasks
}

// O id vem da URL: codificado, um valor estranho chega à API como id fora
// do formato (400), e não como outra rota.
const taskPath = (id) => `/tasks/${encodeURIComponent(id)}`

/** Tarefa inexistente ou, para o `qa`, de outra pessoa: `ApiError` com `TASK_NOT_FOUND`. */
export async function getTask(id) {
  const { task } = await request(taskPath(id))
  return task
}

/** O dono é quem cria, pelo token: o payload não leva `userId`. */
export async function createTask(data) {
  const { task } = await request('/tasks', { method: 'POST', body: data })
  return task
}

/** Edição parcial: concluir ou reabrir envia só `{ status }`. Responde a tarefa. */
export async function updateTask(id, changes) {
  const { task } = await request(taskPath(id), { method: 'PATCH', body: changes })
  return task
}

export function deleteTask(id) {
  return request(taskPath(id), { method: 'DELETE' })
}
