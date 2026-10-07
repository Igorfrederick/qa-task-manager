import type { Page } from '@playwright/test'

import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'
import { PRIORITY_LABELS, STATUS_LABELS } from '../../support/taskLabels'

function waitForTaskCreation(page: Page) {
  return page.waitForResponse(
    (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/tasks',
  )
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
})
