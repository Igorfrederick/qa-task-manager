import type { Locator, Page } from '@playwright/test'

import type { Credentials } from '../services/AuthService'

/** Tela /login. Locators por data-cy e ações de baixo nível; sem asserção. */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly emailError: Locator
  readonly passwordError: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByTestId('login-email-input')
    this.passwordInput = page.getByTestId('login-password-input')
    this.submitButton = page.getByTestId('login-submit-button')
    this.emailError = page.getByTestId('login-email-error')
    this.passwordError = page.getByTestId('login-password-error')
    this.errorMessage = page.getByTestId('login-error-message')
  }

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async fillCredentials({ email, password }: Credentials): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  async login(credentials: Credentials): Promise<void> {
    await this.fillCredentials(credentials)
    await this.submit()
  }
}
