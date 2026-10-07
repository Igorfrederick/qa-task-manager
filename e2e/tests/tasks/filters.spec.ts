import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'

// Ao trocar de filtro, a lista anterior fica na tela até a resposta da API.
// Depois da troca, o sumiço de uma tarefa que o filtro exclui é o que prova a
// lista nova — e só depois dele a presença de uma tarefa vale.
test.describe('filtros da lista', () => {
  test.use({ role: 'qa' })

  test('por status: só as concluídas, e "Todos" traz as abertas de volta', async ({ page, taskListPage, taskApi }) => {
    const openTask = await taskApi.qa.create(buildTask())
    const doneTask = await taskApi.qa.create(buildTask({ status: 'done' }))
    await taskListPage.goto()
    await expect(taskListPage.taskTitle(openTask._id)).toHaveText(openTask.title)

    await taskListPage.filterByStatus('done')

    await expect(page).toHaveURL('/tasks?status=done')
    await expect(taskListPage.taskRow(openTask._id)).toHaveCount(0)
    await expect(taskListPage.taskTitle(doneTask._id)).toHaveText(doneTask.title)

    await taskListPage.filterByStatus('all')

    await expect(page).toHaveURL('/tasks')
    await expect(taskListPage.taskTitle(openTask._id)).toHaveText(openTask.title)
    await expect(taskListPage.taskTitle(doneTask._id)).toHaveText(doneTask.title)
  })

  test('por prioridade: só as de prioridade alta', async ({ page, taskListPage, taskApi }) => {
    const highTask = await taskApi.qa.create(buildTask({ priority: 'high' }))
    const lowTask = await taskApi.qa.create(buildTask({ priority: 'low' }))
    await taskListPage.goto()
    await expect(taskListPage.taskTitle(lowTask._id)).toHaveText(lowTask.title)

    await taskListPage.filterByPriority('high')

    await expect(page).toHaveURL('/tasks?priority=high')
    await expect(taskListPage.taskRow(lowTask._id)).toHaveCount(0)
    await expect(taskListPage.taskTitle(highTask._id)).toHaveText(highTask.title)
  })

  test('status e prioridade pelo endereço: os filtros aparecem na tela, e só a tarefa dos dois fica', async ({
    page,
    taskListPage,
    taskApi,
  }) => {
    const target = await taskApi.qa.create(buildTask({ status: 'done', priority: 'high' }))
    const otherStatus = await taskApi.qa.create(buildTask({ status: 'open', priority: 'high' }))
    const otherPriority = await taskApi.qa.create(buildTask({ status: 'done', priority: 'low' }))

    await page.goto('/tasks?status=done&priority=high')

    await expect(taskListPage.statusFilter).toHaveValue('done')
    await expect(taskListPage.priorityFilter).toHaveValue('high')
    // Sem lista anterior na tela, a tarefa do filtro vem primeiro: é ela que
    // prova a lista carregada, e as ausências depois dela valem.
    await expect(taskListPage.taskTitle(target._id)).toHaveText(target.title)
    await expect(taskListPage.taskRow(otherStatus._id)).toHaveCount(0)
    await expect(taskListPage.taskRow(otherPriority._id)).toHaveCount(0)
  })
})
