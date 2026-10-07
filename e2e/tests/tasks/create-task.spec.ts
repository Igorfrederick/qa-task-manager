import type { Page, Request } from '@playwright/test'

import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'
import { PRIORITY_LABELS, STATUS_LABELS } from '../../support/taskLabels'

const isTaskCreation = (request: Request) =>
  request.method() === 'POST' && new URL(request.url()).pathname === '/api/tasks'

function waitForTaskCreation(page: Page) {
  return page.waitForResponse((response) => isTaskCreation(response.request()))
}

test.describe('criar tarefa pela tela', () => {
  test.use({ role: 'qa' })

  test('a tarefa salva aparece na lista, aberta, e nasce com o dono da sessão', async ({
    page,
    taskListPage,
    taskFormPage,
    taskApi,
    sessions,
  }) => {
    const data = buildTask()
    await taskListPage.goto()
    await taskListPage.openNewTask()
    const creation = waitForTaskCreation(page)

    await taskFormPage.fill(data)
    await taskFormPage.save()

    // O id vem da resposta da criação: é ele que localiza a linha na lista.
    const response = await creation
    expect(response.status()).toBe(201)
    const { task } = await response.json()
    taskApi.track(task._id)
    await expect(page).toHaveURL('/tasks')
    await expect(taskListPage.taskTitle(task._id)).toHaveText(data.title)
    await expect(taskListPage.taskDescription(task._id)).toHaveText(data.description)
    await expect(taskListPage.taskStatus(task._id)).toHaveText(STATUS_LABELS.open)
    await expect(taskListPage.taskPriority(task._id)).toHaveText(PRIORITY_LABELS[data.priority])
    expect(await taskApi.qa.get(task._id)).toMatchObject({
      ...data,
      status: 'open',
      owner: { _id: sessions.qa.user._id },
    })
  })

  test('título vazio: erro no campo, sem chamada à API, e nada é criado', async ({
    page,
    taskFormPage,
    taskApi,
  }) => {
    // A API recusaria o título vazio com a mesma mensagem: sem conferir a
    // chamada, o teste passaria mesmo sem a validação da tela.
    const creationCalls: string[] = []
    page.on('request', (request) => {
      if (isTaskCreation(request)) creationCalls.push(request.url())
    })
    // Sem título para ancorar, a âncora é a descrição, que carrega entropia —
    // nunca a contagem da lista, que outros testes alteram em paralelo.
    const data = buildTask({ title: '' })
    await taskFormPage.gotoNew()

    await taskFormPage.fill(data)
    await taskFormPage.save()

    await expect(taskFormPage.titleError).toHaveText('Informe o título')
    await expect(page).toHaveURL('/tasks/new')
    expect(creationCalls).toEqual([])
    const tasks = await taskApi.qa.list()
    expect(tasks.map((task) => task.description)).not.toContain(data.description)
  })
})
