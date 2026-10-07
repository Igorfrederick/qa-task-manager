import { request } from '@playwright/test'

import { AuthService } from '../services/AuthService'
import { env } from './env'

/**
 * Roda uma vez, depois de a API e o frontend estarem no ar. A suíte entra com
 * as contas do seed; se elas não entram, todo teste falharia no setup com um
 * 401 que não diz a causa. Aqui a falha diz o que fazer.
 */
export default async function globalSetup(): Promise<void> {
  const apiContext = await request.newContext({ baseURL: env.apiUrl })
  const auth = new AuthService(apiContext)

  try {
    for (const role of ['lead', 'qa'] as const) {
      const credentials = env[role]
      let session
      try {
        session = await auth.login(credentials)
      } catch (error) {
        throw new Error(
          `A conta ${role} do e2e/.env (${credentials.email}) não entra na API em ${env.apiUrl}.\n` +
            'Rode `npm run seed` em backend/, com SEED_LEAD_PASSWORD e SEED_QA_PASSWORD iguais a ' +
            'E2E_LEAD_PASSWORD e E2E_QA_PASSWORD.\n' +
            `Causa: ${(error as Error).message}`,
        )
      }
      if (session.user.role !== role) {
        throw new Error(`${credentials.email} entrou com o perfil ${session.user.role}, e a suíte espera ${role}.`)
      }
    }
  } finally {
    await apiContext.dispose()
  }
}
