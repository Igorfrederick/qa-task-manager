import type { Locator, Page } from '@playwright/test'

import type { TaskInput } from '../services/TaskService'

/**
 * Tela de tarefa — `/tasks/new` para criar, `/tasks/:id` para editar: a mesma
 * tela, e por isso um Page Object só. Locators por data-cy e ações de baixo
 * nível; sem asserção.
 */
export class TaskFormPage {
  readonly page: Page
  readonly titleInput: Locator
  readonly descriptionInput: Locator
  readonly prioritySelect: Locator
  readonly titleError: Locator
  readonly saveButton: Locator
  readonly notFound: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.getByTestId('task-form-title-input')
    this.descriptionInput = page.getByTestId('task-form-description-input')
    this.prioritySelect = page.getByTestId('task-form-priority-select')
    this.titleError = page.getByTestId('task-form-title-error')
    this.saveButton = page.getByTestId('task-form-save-button')
    this.notFound = page.getByTestId('task-form-not-found')
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/tasks/new')
  }

  async goto(taskId: string): Promise<void> {
    await this.page.goto(`/tasks/${taskId}`)
  }

  async fill({ title, description, priority }: TaskInput): Promise<void> {
    await this.titleInput.fill(title)
    await this.descriptionInput.fill(description)
    await this.prioritySelect.selectOption(priority)
  }

  async save(): Promise<void> {
    await this.saveButton.click()
  }
}
