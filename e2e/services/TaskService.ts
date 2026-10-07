import type { APIRequestContext, APIResponse } from '@playwright/test'

import { ApiCallError } from './ApiCallError'

export type TaskStatus = 'open' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

/** Corpo de criação. A factory preenche todos os campos que o formulário tem. */
export type TaskInput = {
  title: string
  description: string
  priority: TaskPriority
  status?: TaskStatus
}

export type Task = {
  _id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  owner: { _id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export type TaskFilters = {
  status?: TaskStatus
  priority?: TaskPriority
}

/**
 * Tarefas pela API, com o token de uma sessão. Serve para criar a massa do
 * teste e conferir o efeito do que ele fez na tela — a jornada que o teste
 * prova passa pela tela, não por aqui.
 *
 * `onCreated` avisa cada tarefa criada: é por ele que a fixture sabe o que
 * excluir no fim do teste.
 */
export class TaskService {
  private readonly request: APIRequestContext
  private readonly token: string
  private readonly onCreated: (task: Task) => void

  constructor(request: APIRequestContext, token: string, onCreated: (task: Task) => void = () => {}) {
    this.request = request
    this.token = token
    this.onCreated = onCreated
  }

  async list(filters: TaskFilters = {}): Promise<Task[]> {
    const response = await this.request.get('tasks', { headers: this.headers(), params: filters })
    await this.ensureOk(response, 'A listagem de tarefas')
    const { tasks } = await response.json()
    return tasks
  }

  async create(input: TaskInput): Promise<Task> {
    const response = await this.request.post('tasks', { headers: this.headers(), data: input })
    await this.ensureOk(response, 'A criação de tarefa')
    const { task } = await response.json()
    this.onCreated(task)
    return task
  }

  async get(taskId: string): Promise<Task> {
    const response = await this.request.get(`tasks/${taskId}`, { headers: this.headers() })
    await this.ensureOk(response, `A leitura da tarefa ${taskId}`)
    const { task } = await response.json()
    return task
  }

  async remove(taskId: string): Promise<void> {
    const response = await this.request.delete(`tasks/${taskId}`, { headers: this.headers() })
    await this.ensureOk(response, `A exclusão da tarefa ${taskId}`)
  }

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` }
  }

  private async ensureOk(response: APIResponse, call: string): Promise<void> {
    if (response.ok()) return
    const body = await response.text()
    let code: string | undefined
    try {
      code = JSON.parse(body).error?.code
    } catch {
      // Corpo fora do contrato: o erro segue sem `code`, com o corpo na mensagem.
    }
    throw new ApiCallError(response.status(), `${call} respondeu ${response.status()}: ${body}`, code)
  }
}
