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
 * `POST /tasks`: o dono vem do token (regra 3) e o corpo passa pelo schema
 * (regra 1). Cada recusa assere também que nada foi gravado.
 */
describe('POST /api/tasks', () => {
  const app = createApp()
  let qa
  let otherQa

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
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
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const postTask = (payload, token = qa.token) =>
    request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send(payload)

  it('cria a tarefa com os padrões do contrato e responde 201', async () => {
    const response = await postTask({ title: 'Revisar plano de testes da release' })

    expect(response.status).toBe(201)
    expect(response.body.task).toMatchObject({
      title: 'Revisar plano de testes da release',
      description: '',
      status: TASK_STATUS.OPEN,
      priority: TASK_PRIORITY.MEDIUM,
    })
    expect(response.body.task._id).toBeTruthy()
    expect(response.body.task.createdAt).toBeTruthy()
    expect(await Task.countDocuments()).toBe(1)
  })

  it('grava status, prioridade e descrição informados, com o título aparado', async () => {
    const response = await postTask({
      title: '  Atualizar massa de regressão  ',
      description: 'Incluir os cenários de borda do checkout',
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.HIGH,
    })

    expect(response.status).toBe(201)
    expect(response.body.task).toMatchObject({
      title: 'Atualizar massa de regressão',
      description: 'Incluir os cenários de borda do checkout',
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.HIGH,
    })
  })

  it('identifica o dono em owner, só com _id e name, e não devolve userId', async () => {
    const response = await postTask({ title: 'Revisar plano de testes da release' })

    // Igualdade exata: e-mail, perfil ou hash do dono não podem vazar por aqui.
    expect(response.body.task.owner).toEqual({ _id: qa.user.id, name: 'QA de Teste' })
    expect(response.body.task).not.toHaveProperty('userId')
    // `_id` é o identificador do contrato; `id`, cópia dele, não sai.
    expect(response.body.task).not.toHaveProperty('id')
  })

  it('grava como dono quem cria, mesmo com userId de outra pessoa no payload', async () => {
    // Regra 3: não é violação, não tem erro. Prova-se observando o dono.
    const response = await postTask({ title: 'Tarefa em nome alheio', userId: otherQa.user.id })

    expect(response.status).toBe(201)
    expect(response.body.task.owner._id).toBe(qa.user.id)

    const persisted = await Task.findById(response.body.task._id)
    expect(persisted.userId.toString()).toBe(qa.user.id)
  })

  it.each([
    ['sem título', {}, 'title'],
    ['com título em branco', { title: '   ' }, 'title'],
    ['com título que não é texto', { title: 42 }, 'title'],
    ['com título acima de 120 caracteres', { title: 'a'.repeat(121) }, 'title'],
    ['com descrição acima de 2000 caracteres', { title: 'Válida', description: 'a'.repeat(2001) }, 'description'],
    ['com status fora do domínio', { title: 'Válida', status: 'doing' }, 'status'],
    ['com prioridade fora do domínio', { title: 'Válida', priority: 'urgent' }, 'priority'],
  ])('recusa payload %s com 400 e o campo em details', async (_case, payload, field) => {
    const response = await postTask(payload)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain(field)
    expect(await Task.countDocuments()).toBe(0)
  })

  it('responde 401 TOKEN_MISSING sem token e não cria a tarefa', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Sem dono' })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
    expect(await Task.countDocuments()).toBe(0)
  })
})
