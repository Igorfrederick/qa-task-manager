import { test as base, expect, request } from '@playwright/test'

import { LoginPage } from '../pages/LoginPage'
import { TaskListPage } from '../pages/TaskListPage'
import { AuthService, type Role, type Session } from '../services/AuthService'
import { env } from '../support/env'

// Mesma chave de frontend/src/utils/tokenStorage.js.
const TOKEN_STORAGE_KEY = 'task-manager.token'

type Sessions = Record<Role, Session>

type TestFixtures = {
  role: Role | null
  loginPage: LoginPage
  taskListPage: TaskListPage
  authService: AuthService
}

type WorkerFixtures = {
  sessions: Sessions
}

/**
 * Test base da suíte.
 *
 * Autenticação por perfil: `test.use({ role: 'qa' })` faz o teste começar
 * com o token daquele perfil no localStorage — o mesmo estado que o login
 * deixa —, sem passar pela tela. Sem `role`, o teste começa sem sessão.
 *
 * Os Page Objects chegam por fixture, construídos sobre a página do próprio
 * teste — injeção, sem herança de BasePage. A service layer fala com a API
 * num contexto de requisição apontado para API_URL.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  role: [null, { option: true }],

  // Uma sessão por perfil e por worker, aberta pela API com as contas do seed.
  // Sair na tela só apaga o token do navegador do teste: o JWT não tem estado
  // no servidor, e o token do worker segue valendo para os outros testes.
  sessions: [
    async ({}, use) => {
      const apiContext = await request.newContext({ baseURL: env.apiUrl })
      const auth = new AuthService(apiContext)
      const sessions = { qa: await auth.login(env.qa), lead: await auth.login(env.lead) }
      await apiContext.dispose()
      await use(sessions)
    },
    { scope: 'worker' },
  ],

  storageState: async ({ role, sessions }, use) => {
    if (!role) {
      await use(undefined)
      return
    }
    await use({
      cookies: [],
      origins: [
        {
          origin: new URL(env.baseUrl).origin,
          localStorage: [{ name: TOKEN_STORAGE_KEY, value: sessions[role].token }],
        },
      ],
    })
  },

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
