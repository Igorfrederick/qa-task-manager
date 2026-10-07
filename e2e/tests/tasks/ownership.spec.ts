import { buildTask } from '../../factories/taskFactory'
import { expect, test } from '../../fixtures/test'
import { STATUS_LABELS } from '../../support/taskLabels'

// A "outra pessoa" de cada perfil é a outra conta do seed: a suíte não cria
// usuário. O caso entre dois qa está provado na API, em backend/tests/.
test.describe('escopo por dono — qa', () => {
  test.use({ role: 'qa' })

  test('a lista não mostra a tarefa do lead', async ({ taskListPage, taskApi }) => {
    const ownTask = await taskApi.qa.create(buildTask())
    const leadTask = await taskApi.lead.create(buildTask())

    await taskListPage.goto()

    // A tarefa do próprio qa prova a lista carregada: sem ela, a ausência
    // passaria antes mesmo de a lista chegar.
    await expect(taskListPage.taskTitle(ownTask._id)).toHaveText(ownTask.title)
    await expect(taskListPage.taskRow(leadTask._id)).toHaveCount(0)
  })

  test('a tarefa do lead, aberta pelo endereço, é "tarefa não encontrada"', async ({ taskFormPage, taskApi }) => {
    const leadTask = await taskApi.lead.create(buildTask())

    await taskFormPage.goto(leadTask._id)

    await expect(taskFormPage.notFound).toContainText('Tarefa não encontrada')
  })
})

test.describe('escopo por dono — lead', () => {
  test.use({ role: 'lead' })

  test('a lista mostra a tarefa do qa, com o nome do dono', async ({ taskListPage, taskApi, sessions }) => {
    const qaTask = await taskApi.qa.create(buildTask())

    await taskListPage.goto()

    await expect(taskListPage.taskTitle(qaTask._id)).toHaveText(qaTask.title)
    await expect(taskListPage.taskOwner(qaTask._id)).toHaveText(sessions.qa.user.name)
  })

  test('concluir a tarefa do qa pela lista vale para o qa', async ({ taskListPage, taskApi }) => {
    const qaTask = await taskApi.qa.create(buildTask())
    await taskListPage.goto()

    await taskListPage.completeTask(qaTask._id)

    await expect(taskListPage.taskStatus(qaTask._id)).toHaveText(STATUS_LABELS.done)
    expect((await taskApi.qa.get(qaTask._id)).status).toBe('done')
  })
})
