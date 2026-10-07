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
 * `GET /tasks`: o `qa` recebe só as próprias tarefas; o `lead`, as do time
 * inteiro, com o dono de cada uma (regra 2). Os filtros se somam ao escopo e
 * passam pelo schema (regra 1).
 */
describe('GET /api/tasks', () => {
  const app = createApp()
  let lead
  let qa
  let otherQa

  beforeAll(async () => {
    await connectDatabase()
  })

  // Cada pessoa nasce com tarefas próprias: a do `qa` e a da outra `qa` têm
  // de aparecer separadas, e todas juntas para o `lead`.
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

    // Status e prioridade variados para os filtros; a tarefa concluída da
    // outra QA existe para provar que filtrar não fura o escopo.
    await Task.create({ title: 'Tarefa da líder', userId: lead.user.id })
    await Task.create({
      title: 'Primeira tarefa da QA',
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.HIGH,
      userId: qa.user.id,
    })
    await Task.create({
      title: 'Segunda tarefa da QA',
      priority: TASK_PRIORITY.HIGH,
      userId: qa.user.id,
    })
    await Task.create({
      title: 'Tarefa da outra QA',
      status: TASK_STATUS.DONE,
      priority: TASK_PRIORITY.LOW,
      userId: otherQa.user.id,
    })
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const getTasks = (token, query = {}) =>
    request(app).get('/api/tasks').query(query).set('Authorization', `Bearer ${token}`)

  const titles = (response) => response.body.tasks.map((task) => task.title)

  it('devolve ao qa só as próprias tarefas, da mais recente para a mais antiga', async () => {
    const response = await getTasks(qa.token)

    expect(response.status).toBe(200)
    expect(titles(response)).toEqual(['Segunda tarefa da QA', 'Primeira tarefa da QA'])
  })

  it('devolve ao lead as tarefas do time inteiro, com o dono de cada uma', async () => {
    const response = await getTasks(lead.token)

    expect(response.status).toBe(200)
    expect(response.body.tasks.map(({ title, owner }) => [title, owner])).toEqual([
      ['Tarefa da outra QA', { _id: otherQa.user.id, name: 'Outra QA de Teste' }],
      ['Segunda tarefa da QA', { _id: qa.user.id, name: 'QA de Teste' }],
      ['Primeira tarefa da QA', { _id: qa.user.id, name: 'QA de Teste' }],
      ['Tarefa da líder', { _id: lead.user.id, name: 'Líder de Teste' }],
    ])
  })

  it('responde 200 com lista vazia ao qa sem tarefas', async () => {
    await Task.deleteMany({ userId: qa.user.id })

    const response = await getTasks(qa.token)

    expect(response.status).toBe(200)
    expect(response.body.tasks).toEqual([])
  })

  it.each([
    ['status', { status: TASK_STATUS.DONE }, ['Primeira tarefa da QA']],
    ['prioridade', { priority: TASK_PRIORITY.HIGH }, ['Segunda tarefa da QA', 'Primeira tarefa da QA']],
    ['status e prioridade juntos', { status: TASK_STATUS.OPEN, priority: TASK_PRIORITY.HIGH }, ['Segunda tarefa da QA']],
  ])('filtra por %s sem sair das tarefas do qa', async (_case, query, expected) => {
    const response = await getTasks(qa.token, query)

    expect(response.status).toBe(200)
    expect(titles(response)).toEqual(expected)
  })

  it('filtra as tarefas do time inteiro para o lead', async () => {
    const response = await getTasks(lead.token, { status: TASK_STATUS.DONE })

    expect(response.status).toBe(200)
    expect(titles(response)).toEqual(['Tarefa da outra QA', 'Primeira tarefa da QA'])
  })

  it.each([
    ['status fora do domínio', '?status=doing', 'status'],
    ['prioridade fora do domínio', '?priority=urgent', 'priority'],
    ['status repetido', '?status=open&status=done', 'status'],
    // Para não filtrar, o parâmetro é omitido; vazio é valor fora do domínio.
    ['status vazio', '?status=', 'status'],
  ])('recusa filtro com %s com 400 e o campo em details', async (_case, query, field) => {
    const response = await request(app)
      .get(`/api/tasks${query}`)
      .set('Authorization', `Bearer ${qa.token}`)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain(field)
  })

  it('descarta filtro fora do schema antes de consultar o banco', async () => {
    // Só status e priority chegam à consulta. Sem a substituição de req.query
    // no middleware, este operador seria aplicado pelo MongoDB e a lista viria
    // vazia — e um ?$where executaria JavaScript no banco.
    const response = await request(app)
      .get('/api/tasks?title[$regex]=nada-casa-com-isto')
      .set('Authorization', `Bearer ${qa.token}`)

    expect(response.status).toBe(200)
    expect(titles(response)).toEqual(['Segunda tarefa da QA', 'Primeira tarefa da QA'])
  })

  it('responde 401 TOKEN_MISSING sem token', async () => {
    const response = await request(app).get('/api/tasks')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
  })
})
