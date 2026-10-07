import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { ROLES } from '../../src/utils/roles.js'
import { createUserWithToken } from '../helpers/users.js'

/**
 * `GET /tasks/:id`: para o `qa`, tarefa de outra pessoa responde exatamente
 * como tarefa inexistente (regra 2). O `lead` alcança qualquer uma.
 */
describe('GET /api/tasks/:id', () => {
  const app = createApp()
  let lead
  let qa
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
    const otherQa = await createUserWithToken({
      name: 'Outra QA de Teste',
      email: 'outra-qa@exemplo.test',
      role: ROLES.QA,
    })

    qaTask = await Task.create({ title: 'Tarefa da QA', userId: qa.user.id })
    otherQaTask = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.user.id })
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const getTask = (id, token) =>
    request(app).get(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`)

  it('devolve ao dono a própria tarefa, com o dono preenchido', async () => {
    const response = await getTask(qaTask.id, qa.token)

    expect(response.status).toBe(200)
    expect(response.body.task).toMatchObject({
      _id: qaTask.id,
      title: 'Tarefa da QA',
      owner: { _id: qa.user.id, name: 'QA de Teste' },
    })
  })

  it('devolve ao lead a tarefa de outra pessoa', async () => {
    const response = await getTask(otherQaTask.id, lead.token)

    expect(response.status).toBe(200)
    expect(response.body.task.title).toBe('Tarefa da outra QA')
  })

  it('responde 404 TASK_NOT_FOUND ao qa que pede a tarefa de outra pessoa', async () => {
    const response = await getTask(otherQaTask.id, qa.token)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TASK_NOT_FOUND')
  })

  it('responde à tarefa alheia com o mesmo corpo da tarefa inexistente', async () => {
    // Igualdade do corpo inteiro: qualquer diferença — status, mensagem,
    // details — contaria ao qa que a tarefa existe.
    const foreign = await getTask(otherQaTask.id, qa.token)
    const missing = await getTask(new mongoose.Types.ObjectId().toString(), qa.token)

    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('TASK_NOT_FOUND')
    expect(foreign.status).toBe(missing.status)
    expect(foreign.body).toEqual(missing.body)
  })

  it('responde 404 TASK_NOT_FOUND ao lead que pede tarefa inexistente', async () => {
    const response = await getTask(new mongoose.Types.ObjectId().toString(), lead.token)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TASK_NOT_FOUND')
  })

  it('recusa id fora do formato com 400 e id em details, não com 500', async () => {
    const response = await getTask('nao-e-um-id', qa.token)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('id')
  })

  it('responde 401 TOKEN_MISSING sem token', async () => {
    const response = await request(app).get(`/api/tasks/${qaTask.id}`)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
  })
})
