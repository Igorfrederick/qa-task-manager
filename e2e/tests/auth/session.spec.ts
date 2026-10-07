import { expect, test } from '../../fixtures/test'
import { env } from '../../support/env'

for (const role of ['qa', 'lead'] as const) {
  test.describe(`sessão de ${role} guardada no navegador`, () => {
    test.use({ role })

    test('a lista abre direto, com o usuário restaurado pela API', async ({ page, taskListPage, sessions }) => {
      await taskListPage.goto()

      await expect(page).toHaveURL('/tasks')
      await expect(taskListPage.userName).toHaveText(sessions[role].user.name)
    })

    test('sair encerra a sessão, e a lista volta a pedir login', async ({ page, taskListPage, loginPage }) => {
      await taskListPage.goto()

      await taskListPage.logout()

      await expect(page).toHaveURL('/login')
      await taskListPage.goto()
      await expect(page).toHaveURL('/login')
      await expect(loginPage.emailInput).toBeEditable()
    })
  })
}

test.describe('sem sessão', () => {
  test('a rota pedida, com os filtros, abre depois do login', async ({ page, loginPage }) => {
    await page.goto('/tasks?status=done&priority=high')
    await expect(page).toHaveURL('/login')

    await loginPage.login(env.qa)

    await expect(page).toHaveURL('/tasks?status=done&priority=high')
  })
})
