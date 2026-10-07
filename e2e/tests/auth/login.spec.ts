import type { Page } from '@playwright/test'

import { buildCredentials, buildMalformedEmail } from '../../factories/credentialsFactory'
import { expect, test } from '../../fixtures/test'
import { env } from '../../support/env'

const isLoginCall = (url: string) => new URL(url).pathname === '/api/auth/login'

function waitForLoginResponse(page: Page) {
  return page.waitForResponse((response) => isLoginCall(response.url()))
}

test.describe('login pela tela', () => {
  for (const role of ['qa', 'lead'] as const) {
    test(`${role} com credenciais válidas chega à lista, com o próprio nome`, async ({
      page,
      loginPage,
      taskListPage,
      sessions,
    }) => {
      await loginPage.goto()

      await loginPage.login(env[role])

      await expect(page).toHaveURL('/tasks')
      await expect(taskListPage.userName).toHaveText(sessions[role].user.name)
    })
  }

  // Liga a tela ao atalho das fixtures: os outros testes começam com o token
  // no localStorage porque é esse o estado que o login deixa.
  test('a sessão aberta pela tela sobrevive à recarga', async ({ page, loginPage, taskListPage, sessions }) => {
    await loginPage.goto()
    await loginPage.login(env.qa)
    await expect(page).toHaveURL('/tasks')

    await page.reload()

    await expect(page).toHaveURL('/tasks')
    await expect(taskListPage.userName).toHaveText(sessions.qa.user.name)
  })

  test('a rota pedida sem sessão, com os filtros, abre depois do login', async ({ page, loginPage, taskListPage }) => {
    await page.goto('/tasks?status=done&priority=high')
    await expect(page).toHaveURL('/login')

    await loginPage.login(env.qa)

    await expect(page).toHaveURL('/tasks?status=done&priority=high')
    await expect(taskListPage.statusFilter).toHaveValue('done')
    await expect(taskListPage.priorityFilter).toHaveValue('high')
  })

  const invalidCredentials = [
    { case: 'senha errada', build: () => buildCredentials({ email: env.qa.email }) },
    { case: 'e-mail inexistente', build: () => buildCredentials() },
  ]

  for (const { case: name, build } of invalidCredentials) {
    test(`${name}: fica no /login com o erro, e a API responde INVALID_CREDENTIALS`, async ({ page, loginPage }) => {
      await loginPage.goto()
      const loginResponse = waitForLoginResponse(page)

      await loginPage.login(build())

      const response = await loginResponse
      const { error } = await response.json()
      expect(response.status()).toBe(401)
      expect(error.code).toBe('INVALID_CREDENTIALS')
      // A tela mostra o que a API disse, sem o teste fixar o texto.
      await expect(loginPage.errorMessage).toHaveText(error.message)
      await expect(page).toHaveURL('/login')
    })
  }

  test('campos vazios: erro em cada campo, sem chamada à API', async ({ page, loginPage }) => {
    const loginCalls: string[] = []
    page.on('request', (request) => {
      if (isLoginCall(request.url())) loginCalls.push(request.url())
    })
    await loginPage.goto()

    await loginPage.submit()

    await expect(loginPage.emailError).toHaveText('Informe o e-mail')
    await expect(loginPage.passwordError).toHaveText('Informe a senha')
    expect(loginCalls).toEqual([])
  })

  test('e-mail fora do formato: erro no campo, sem chamada à API', async ({ page, loginPage }) => {
    const loginCalls: string[] = []
    page.on('request', (request) => {
      if (isLoginCall(request.url())) loginCalls.push(request.url())
    })
    await loginPage.goto()

    await loginPage.login(buildCredentials({ email: buildMalformedEmail() }))

    await expect(loginPage.emailError).toHaveText('E-mail em formato inválido')
    await expect(loginPage.passwordError).toHaveCount(0)
    expect(loginCalls).toEqual([])
  })
})
