import { buildTaskId } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'

// O título do teste é fixo e o caminho é gerado dentro dele: o Playwright
// recarrega o arquivo em cada worker, e um título com id aleatório mudaria.
const routes = [
  { title: '/tasks', path: () => '/tasks' },
  { title: '/tasks/new', path: () => '/tasks/new' },
  { title: '/tasks/:id', path: () => `/tasks/${buildTaskId()}` },
  { title: '/', path: () => '/' },
]

test.describe('rotas protegidas, sem sessão', () => {
  for (const route of routes) {
    test(`${route.title} leva ao /login`, async ({ page, loginPage }) => {
      await page.goto(route.path())

      await expect(page).toHaveURL('/login')
      await expect(loginPage.emailInput).toBeEditable()
    })
  }
})
