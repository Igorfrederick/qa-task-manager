import type { Locator, Page } from '@playwright/test'

import type { TaskPriority, TaskStatus } from '../services/TaskService'

/**
 * Tela /tasks, com o cabeçalho da sessão — nome do usuário e saída — que
 * aparece sobre ela. Locators por data-cy e ações de baixo nível; sem asserção.
 *
 * Cada tarefa se localiza pelo `_id`: as contas do seed são compartilhadas
 * entre testes em paralelo, e a lista mostra também as tarefas dos outros.
 */
export class TaskListPage {
  readonly page: Page
  readonly userName: Locator
  readonly logoutButton: Locator
  readonly newTaskButton: Locator
  readonly statusFilter: Locator
  readonly priorityFilter: Locator

  constructor(page: Page) {
    this.page = page
    this.userName = page.getByTestId('header-user-name')
    this.logoutButton = page.getByTestId('header-logout-button')
    this.newTaskButton = page.getByTestId('task-list-new-button')
    this.statusFilter = page.getByTestId('task-filter-status-select')
    this.priorityFilter = page.getByTestId('task-filter-priority-select')
  }

  async goto(): Promise<void> {
    await this.page.goto('/tasks')
  }

  taskRow(taskId: string): Locator {
    return this.page.getByTestId(`task-list-row-${taskId}`)
  }

  taskTitle(taskId: string): Locator {
    return this.page.getByTestId(`task-list-title-${taskId}`)
  }

  taskDescription(taskId: string): Locator {
    return this.page.getByTestId(`task-list-description-${taskId}`)
  }

  taskStatus(taskId: string): Locator {
    return this.page.getByTestId(`task-list-status-${taskId}`)
  }

  taskPriority(taskId: string): Locator {
    return this.page.getByTestId(`task-list-priority-${taskId}`)
  }

  /** Só o lead vê o dono de cada tarefa. */
  taskOwner(taskId: string): Locator {
    return this.page.getByTestId(`task-list-owner-${taskId}`)
  }

  async logout(): Promise<void> {
    await this.logoutButton.click()
  }

  // 'all' é a opção "Todos", que tira o filtro da URL.
  async filterByStatus(status: TaskStatus | 'all'): Promise<void> {
    await this.statusFilter.selectOption(status === 'all' ? '' : status)
  }

  async filterByPriority(priority: TaskPriority | 'all'): Promise<void> {
    await this.priorityFilter.selectOption(priority === 'all' ? '' : priority)
  }

  async openNewTask(): Promise<void> {
    await this.newTaskButton.click()
  }

  async editTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-list-edit-button-${taskId}`).click()
  }

  async completeTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-list-complete-button-${taskId}`).click()
  }

  async reopenTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-list-reopen-button-${taskId}`).click()
  }

  // A exclusão pede confirmação pelo diálogo nativo. Sem ouvinte registrado
  // antes do clique, o Playwright descarta o diálogo, o confirm devolve false
  // e nada é excluído — decisão de 07/10/2026.
  async deleteTask(taskId: string): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept())
    await this.page.getByTestId(`task-list-delete-button-${taskId}`).click()
  }
}
