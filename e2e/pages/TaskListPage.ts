import type { Locator, Page } from '@playwright/test'

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

  constructor(page: Page) {
    this.page = page
    this.userName = page.getByTestId('header-user-name')
    this.logoutButton = page.getByTestId('header-logout-button')
    this.newTaskButton = page.getByTestId('task-list-new-button')
  }

  async goto(): Promise<void> {
    await this.page.goto('/tasks')
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

  async logout(): Promise<void> {
    await this.logoutButton.click()
  }

  async openNewTask(): Promise<void> {
    await this.newTaskButton.click()
  }

  async editTask(taskId: string): Promise<void> {
    await this.page.getByTestId(`task-list-edit-button-${taskId}`).click()
  }
}
