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
      authService,
    }) => {
      const { user } = await authService.login(env[role])
      await loginPage.goto()

      await loginPage.login(env[role])

      await expect(page).toHaveURL('/tasks')
      await expect(taskListPage.userName).toHaveText(user.name)
    })
  }

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
      expect(response.status()).toBe(401)
      expect((await response.json()).error.code).toBe('INVALID_CREDENTIALS')
      await expect(loginPage.errorMessage).toBeVisible()
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
