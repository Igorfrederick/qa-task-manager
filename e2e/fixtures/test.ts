import { test as base, expect } from '@playwright/test'

import { LoginPage } from '../pages/LoginPage'

type Pages = {
  loginPage: LoginPage
}

/**
 * Test base da suíte: os Page Objects chegam ao teste por fixture, construídos
 * sobre a página do próprio teste — injeção, sem herança de BasePage.
 */
export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
})

export { expect }
