import { test as base, expect, request } from '@playwright/test'

import { LoginPage } from '../pages/LoginPage'
import { TaskListPage } from '../pages/TaskListPage'
import { AuthService } from '../services/AuthService'
import { env } from '../support/env'

type Fixtures = {
  loginPage: LoginPage
  taskListPage: TaskListPage
  authService: AuthService
}

/**
 * Test base da suíte. Os Page Objects chegam ao teste por fixture,
 * construídos sobre a página do próprio teste — injeção, sem herança de
 * BasePage. A service layer fala com a API num contexto de requisição
 * próprio, apontado para API_URL, e descartado ao fim do teste.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page))
  },

  authService: async ({}, use) => {
    const apiContext = await request.newContext({ baseURL: env.apiUrl })
    await use(new AuthService(apiContext))
    await apiContext.dispose()
  },
})

export { expect }
