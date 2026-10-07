import type { Locator, Page } from '@playwright/test'

/** Tela /login. Locators por data-cy e ações de baixo nível; sem asserção. */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByTestId('login-email-input')
  }

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }
}
