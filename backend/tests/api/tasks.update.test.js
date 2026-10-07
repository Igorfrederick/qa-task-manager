import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { ROLES } from '../../src/utils/roles.js'
import { TASK_PRIORITY, TASK_STATUS } from '../../src/utils/taskEnums.js'
import { createUserWithToken } from '../helpers/users.js'

/**
 * `PATCH /tasks/:id`: edição parcial, com o mesmo escopo por dono da leitura
 * (regra 2) e as mesmas regras de corpo da criação (regra 1). Cada recusa
 * assere também que a tarefa ficou como estava no banco.
 */
describe('PATCH /api/tasks/:id', () => {
  const app = createApp()
  let lead
  let qa
  let otherQa
  let qaTask
  let otherQaTask

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    lead = await createUserWithToken({
      name: 'Líder de Teste',
      email: 'lead@exemplo.test',
      role: ROLES.LEAD,
    })
    qa = await createUserWithToken({
      name: 'QA de Teste',
      email: 'qa@exemplo.test',
      role: ROLES.QA,
    })
    otherQa = await createUserWithToken({
      name: 'Outra QA de Teste',
      email: 'outra-qa@exemplo.test',
      role: ROLES.QA,
    })

    qaTask = await Task.create({
      title: 'Tarefa da QA',
      description: 'Descrição original',
      priority: TASK_PRIORITY.HIGH,
      userId: qa.user.id,
    })
    otherQaTask = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.user.id })
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const patchTask = (id, payload, token = qa.token) =>
    request(app).patch(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`).send(payload)

  it('altera só o campo enviado e mantém os demais', async () => {
    const response = await patchTask(qaTask.id, { title: 'Título revisado' })

    expect(response.status).toBe(200)
    expect(response.body.task).toMatchObject({
      _id: qaTask.id,
      title: 'Título revisado',
      description: 'Descrição original',
      status: TASK_STATUS.OPEN,
      priority: TASK_PRIORITY.HIGH,
      owner: { _id: qa.user.id, name: 'QA de Teste' },
    })

    const persisted = await Task.findById(qaTask.id)
    expect(persisted.title).toBe('Título revisado')
    expect(persisted.priority).toBe(TASK_PRIORITY.HIGH)
  })

  it('conclui e reabre a tarefa enviando só o status', async () => {
    const done = await patchTask(qaTask.id, { status: TASK_STATUS.DONE })
    expect(done.status).toBe(200)
    expect(done.body.task.status).toBe(TASK_STATUS.DONE)

    const reopened = await patchTask(qaTask.id, { status: TASK_STATUS.OPEN })
    expect(reopened.status).toBe(200)
    expect(reopened.body.task.status).toBe(TASK_STATUS.OPEN)
    expect(reopened.body.task.title).toBe('Tarefa da QA')
  })

  it('não transfere a tarefa com userId de outra pessoa no payload', async () => {
    const response = await patchTask(qaTask.id, {
      title: 'Tentativa de transferência',
      userId: otherQa.user.id,
    })

    expect(response.status).toBe(200)
    expect(response.body.task.owner._id).toBe(qa.user.id)

    const persisted = await Task.findById(qaTask.id)
    expect(persisted.userId.toString()).toBe(qa.user.id)
  })

  it('responde 200 com a tarefa como estava quando o corpo não traz campo editável', async () => {
    const response = await patchTask(qaTask.id, {})

    expect(response.status).toBe(200)
    expect(response.body.task).toMatchObject({
      title: 'Tarefa da QA',
      description: 'Descrição original',
      status: TASK_STATUS.OPEN,
      priority: TASK_PRIORITY.HIGH,
    })
  })

  it('responde 404 TASK_NOT_FOUND ao qa que edita a tarefa de outra pessoa, sem alterá-la', async () => {
    const response = await patchTask(otherQaTask.id, { title: 'Editada por outra pessoa' })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TASK_NOT_FOUND')

    const persisted = await Task.findById(otherQaTask.id)
    expect(persisted.title).toBe('Tarefa da outra QA')
  })

  it('deixa o lead editar a tarefa de outra pessoa, sem tomar o lugar do dono', async () => {
    const response = await patchTask(
      otherQaTask.id,
      { priority: TASK_PRIORITY.LOW },
      lead.token,
    )

    expect(response.status).toBe(200)
    expect(response.body.task.priority).toBe(TASK_PRIORITY.LOW)
    expect(response.body.task.owner._id).toBe(otherQa.user.id)
  })

  it.each([
    ['com título em branco', { title: '   ' }, 'title'],
    ['com título acima de 120 caracteres', { title: 'a'.repeat(121) }, 'title'],
    ['com descrição acima de 2000 caracteres', { description: 'a'.repeat(2001) }, 'description'],
    ['com status fora do domínio', { status: 'doing' }, 'status'],
    ['com prioridade fora do domínio', { priority: 'urgent' }, 'priority'],
  ])('recusa payload %s com 400 e o campo em details', async (_case, payload, field) => {
    const response = await patchTask(qaTask.id, payload)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain(field)

    const persisted = await Task.findById(qaTask.id)
    expect(persisted.toObject()).toMatchObject({
      title: 'Tarefa da QA',
      description: 'Descrição original',
      status: TASK_STATUS.OPEN,
      priority: TASK_PRIORITY.HIGH,
    })
  })

  it('recusa id fora do formato com 400 e id em details, não com 500', async () => {
    const response = await patchTask('nao-e-um-id', { title: 'Válido' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('id')
  })

  it('responde 401 TOKEN_MISSING sem token e não altera a tarefa', async () => {
    const response = await request(app)
      .patch(`/api/tasks/${qaTask.id}`)
      .send({ title: 'Sem token' })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')

    const persisted = await Task.findById(qaTask.id)
    expect(persisted.title).toBe('Tarefa da QA')
  })
})
