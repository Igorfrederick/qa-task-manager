import { test as base, expect, request } from '@playwright/test'

import { LoginPage } from '../pages/LoginPage'
import { TaskFormPage } from '../pages/TaskFormPage'
import { TaskListPage } from '../pages/TaskListPage'
import { ApiCallError } from '../services/ApiCallError'
import { AuthService, type Role, type Session } from '../services/AuthService'
import { TaskService } from '../services/TaskService'
import { env } from '../support/env'

// Mesma chave de frontend/src/utils/tokenStorage.js.
const TOKEN_STORAGE_KEY = 'task-manager.token'

type Sessions = Record<Role, Session>

/**
 * Tarefas pela API, um service por perfil — `taskApi.qa`, `taskApi.lead` —,
 * cada um com o token daquela sessão.
 */
type TaskApi = Record<Role, TaskService> & {
  /** Anota para a limpeza uma tarefa que o teste criou pela tela, com o perfil do teste. */
  track(taskId: string): void
}

type TestFixtures = {
  role: Role | null
  loginPage: LoginPage
  taskListPage: TaskListPage
  taskFormPage: TaskFormPage
  taskApi: TaskApi
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
 * teste — injeção, sem herança de BasePage.
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

  taskFormPage: async ({ page }, use) => {
    await use(new TaskFormPage(page))
  },

  // O teste limpa o que criou: cada tarefa criada pela API, ou anotada com
  // `track` depois de criada pela tela, sai no teardown — que roda também
  // quando o teste falha. Sai pelo perfil que a criou, e não pelo lead, que
  // alcança todas: a limpeza não depende da regra de escopo que um teste
  // pode estar provando.
  taskApi: async ({ role, sessions }, use) => {
    const apiContext = await request.newContext({ baseURL: env.apiUrl })
    const created: { owner: Role; taskId: string }[] = []
    const serviceFor = (owner: Role) =>
      new TaskService(apiContext, sessions[owner].token, (task) => created.push({ owner, taskId: task._id }))
    const services = { qa: serviceFor('qa'), lead: serviceFor('lead') }

    await use({
      ...services,
      track(taskId) {
        if (!role) throw new Error('taskApi.track exige um perfil: use test.use({ role }).')
        created.push({ owner: role, taskId })
      },
    })

    // Uma exclusão que falha não interrompe as outras: as falhas se acumulam e
    // saem juntas no fim.
    const failures: unknown[] = []
    for (const { owner, taskId } of created) {
      try {
        await services[owner].remove(taskId)
      } catch (error) {
        // A tarefa que o próprio teste excluiu já não existe.
        if (!(error instanceof ApiCallError && error.code === 'TASK_NOT_FOUND')) failures.push(error)
      }
    }
    await apiContext.dispose()
    if (failures.length > 0) {
      throw new AggregateError(failures, `A limpeza falhou para ${failures.length} tarefa(s) criada(s) pelo teste.`)
    }
  },
})

export { expect }
