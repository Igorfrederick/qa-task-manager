import { expect, test } from '../../fixtures/test'
import type { Role, Session } from '../../services/AuthService'
import { readStoredToken, writeStoredToken } from '../../support/storedToken'

const isMeCall = (url: string) => new URL(url).pathname === '/api/auth/me'

/**
 * O token com o `sub` trocado e a assinatura original: quem tenta se passar
 * por outra pessoa. A assinatura deixa de conferir com o payload.
 */
function withForeignSubject(token: string, userId: string): string {
  const [header, payload, signature] = token.split('.')
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  const tampered = Buffer.from(JSON.stringify({ ...claims, sub: userId })).toString('base64url')
  return [header, tampered, signature].join('.')
}

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

// Token expirado fica na API, em backend/tests/: forjá-lo pediria o
// JWT_SECRET na suíte, e a tela trata todo 401 do mesmo jeito.
test.describe('token recusado pela API ao abrir a aplicação', () => {
  const refusedTokens = [
    { case: 'malformado', build: () => 'nao-e-um-jwt' },
    {
      case: 'com o payload adulterado',
      build: (sessions: Record<Role, Session>) => withForeignSubject(sessions.qa.token, sessions.lead.user._id),
    },
  ]

  for (const { case: name, build } of refusedTokens) {
    test(`${name}: volta ao /login, e o token sai do navegador`, async ({
      page,
      loginPage,
      taskListPage,
      sessions,
    }) => {
      await loginPage.goto()
      await writeStoredToken(page, build(sessions))
      const meResponse = page.waitForResponse((response) => isMeCall(response.url()))

      await taskListPage.goto()

      const response = await meResponse
      expect(response.status()).toBe(401)
      expect((await response.json()).error.code).toBe('TOKEN_INVALID')
      await expect(page).toHaveURL('/login')
      await expect(loginPage.emailInput).toBeEditable()
      expect(await readStoredToken(page)).toBeNull()
    })
  }
})
