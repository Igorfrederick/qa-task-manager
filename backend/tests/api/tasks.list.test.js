import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { ROLES } from '../../src/utils/roles.js'
import { createUserWithToken } from '../helpers/users.js'

/**
 * `GET /tasks`: o `qa` recebe só as próprias tarefas; o `lead`, as do time
 * inteiro, com o dono de cada uma (regra 2).
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

    await Task.create({ title: 'Tarefa da líder', userId: lead.user.id })
    await Task.create({ title: 'Primeira tarefa da QA', userId: qa.user.id })
    await Task.create({ title: 'Segunda tarefa da QA', userId: qa.user.id })
    await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.user.id })
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const getTasks = (token) =>
    request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`)

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

  it('responde 401 TOKEN_MISSING sem token', async () => {
    const response = await request(app).get('/api/tasks')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
  })
})
