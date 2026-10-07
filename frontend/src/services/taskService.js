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
