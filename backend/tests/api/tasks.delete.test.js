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
 * `DELETE /tasks/:id`: `204` sem corpo, com o mesmo escopo por dono da leitura
 * e da edição (regra 2). Cada recusa assere também que a tarefa continua no
 * banco.
 */
describe('DELETE /api/tasks/:id', () => {
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

  const deleteTask = (id, token) =>
    request(app).delete(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`)

  it('exclui a própria tarefa e responde 204 sem corpo', async () => {
    const response = await deleteTask(qaTask.id, qa.token)

    expect(response.status).toBe(204)
    expect(response.text).toBe('')
    expect(await Task.exists({ _id: qaTask.id })).toBeNull()
    // Só a tarefa pedida sai: a da outra pessoa continua lá.
    expect(await Task.exists({ _id: otherQaTask.id })).toBeTruthy()
  })

  it('deixa o lead excluir a tarefa de outra pessoa', async () => {
    const response = await deleteTask(otherQaTask.id, lead.token)

    expect(response.status).toBe(204)
    expect(await Task.exists({ _id: otherQaTask.id })).toBeNull()
  })

  it('responde 404 TASK_NOT_FOUND ao qa que exclui a tarefa de outra pessoa, sem excluí-la', async () => {
    const response = await deleteTask(otherQaTask.id, qa.token)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TASK_NOT_FOUND')
    expect(await Task.exists({ _id: otherQaTask.id })).toBeTruthy()
  })

  it('responde 404 TASK_NOT_FOUND para tarefa inexistente', async () => {
    const response = await deleteTask(new mongoose.Types.ObjectId().toString(), lead.token)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TASK_NOT_FOUND')
  })

  it('recusa id fora do formato com 400 e id em details, não com 500', async () => {
    const response = await deleteTask('nao-e-um-id', qa.token)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('id')
  })

  it('responde 401 TOKEN_MISSING sem token e não exclui a tarefa', async () => {
    const response = await request(app).delete(`/api/tasks/${qaTask.id}`)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
    expect(await Task.exists({ _id: qaTask.id })).toBeTruthy()
  })
})
