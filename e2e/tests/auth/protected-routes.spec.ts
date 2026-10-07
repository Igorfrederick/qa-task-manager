import { expect, test } from '../../fixtures/test'

test.describe('rotas protegidas, sem sessão', () => {
  for (const route of ['/tasks', '/tasks/new', '/']) {
    test(`${route} leva ao /login`, async ({ page, loginPage }) => {
      await page.goto(route)

      await expect(page).toHaveURL('/login')
      await expect(loginPage.emailInput).toBeEditable()
    })
  }
})
