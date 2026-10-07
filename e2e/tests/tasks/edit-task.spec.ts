import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'
import { PRIORITY_LABELS } from '../../support/taskLabels'

test.describe('editar tarefa pela tela', () => {
  test.use({ role: 'qa' })

  test('o formulário abre com os valores da tarefa, e a lista mostra os novos', async ({
    page,
    taskListPage,
    taskFormPage,
    taskApi,
  }) => {
    // Prioridades fixadas e distintas: trocar para a mesma não provaria nada.
    const task = await taskApi.qa.create(buildTask({ priority: 'low' }))
    const changes = buildTask({ priority: 'high' })
    await taskListPage.goto()

    await taskListPage.editTask(task._id)

    await expect(page).toHaveURL(`/tasks/${task._id}`)
    await expect(taskFormPage.titleInput).toHaveValue(task.title)
    await expect(taskFormPage.descriptionInput).toHaveValue(task.description)
    await expect(taskFormPage.prioritySelect).toHaveValue('low')

    await taskFormPage.fill(changes)
    await taskFormPage.save()

    await expect(page).toHaveURL('/tasks')
    await expect(taskListPage.taskTitle(task._id)).toHaveText(changes.title)
    await expect(taskListPage.taskDescription(task._id)).toHaveText(changes.description)
    await expect(taskListPage.taskPriority(task._id)).toHaveText(PRIORITY_LABELS.high)
    expect(await taskApi.qa.get(task._id)).toMatchObject({ ...changes, status: 'open' })
  })
})
