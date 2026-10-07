import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'
import { STATUS_LABELS } from '../../support/taskLabels'

test.describe('ações da lista', () => {
  test.use({ role: 'qa' })

  test('concluir: a linha passa a concluída, e a API confirma', async ({ taskListPage, taskApi }) => {
    const task = await taskApi.qa.create(buildTask())
    await taskListPage.goto()

    await taskListPage.completeTask(task._id)

    await expect(taskListPage.taskStatus(task._id)).toHaveText(STATUS_LABELS.done)
    expect((await taskApi.qa.get(task._id)).status).toBe('done')
  })

  test('reabrir: a linha volta a aberta, e a API confirma', async ({ taskListPage, taskApi }) => {
    const task = await taskApi.qa.create(buildTask({ status: 'done' }))
    await taskListPage.goto()

    await taskListPage.reopenTask(task._id)

    await expect(taskListPage.taskStatus(task._id)).toHaveText(STATUS_LABELS.open)
    expect((await taskApi.qa.get(task._id)).status).toBe('open')
  })

  test('excluir: a linha some, e a API responde TASK_NOT_FOUND para a tarefa', async ({
    taskListPage,
    taskApi,
  }) => {
    const task = await taskApi.qa.create(buildTask())
    await taskListPage.goto()

    // O clique espera a linha na tela: o sumiço depois dele é a exclusão.
    await taskListPage.deleteTask(task._id)

    await expect(taskListPage.taskRow(task._id)).toHaveCount(0)
    await expect(taskApi.qa.get(task._id)).rejects.toMatchObject({ status: 404, code: 'TASK_NOT_FOUND' })
  })
})
