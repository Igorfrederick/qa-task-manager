import type { Locator, Page } from '@playwright/test'

/**
 * Tela /tasks, com o cabeçalho da sessão — nome do usuário e saída — que
 * aparece sobre ela. Locators por data-cy e ações de baixo nível; sem asserção.
 */
export class TaskListPage {
  readonly page: Page
  readonly userName: Locator

  constructor(page: Page) {
    this.page = page
    this.userName = page.getByTestId('header-user-name')
  }

  async goto(): Promise<void> {
    await this.page.goto('/tasks')
  }
}
