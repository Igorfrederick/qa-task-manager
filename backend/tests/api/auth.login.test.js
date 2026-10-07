import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { User } from '../../src/models/User.js'
import { registerUser } from '../../src/services/userService.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste da rota de login: status, corpo e o que sai — ou não sai — na resposta.
 */
describe('POST /api/auth/login', () => {
  const app = createApp()
  const credentials = { email: 'fulana@exemplo.test', password: 'senha-de-teste-123' }

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    await registerUser({ name: 'Fulana de Teste', role: ROLES.QA, ...credentials })
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('responde 200 com token e usuário', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials)

    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
    expect(response.body.user).toMatchObject({
      name: 'Fulana de Teste',
      email: credentials.email,
      role: ROLES.QA,
    })
  })

  it('NÃO devolve passwordHash nem a senha no corpo da resposta', async () => {
    // O login é o caminho que seleciona o hash de propósito: é aqui que o
    // transform do schema prova que é a barreira que vale.
    const response = await request(app).post('/api/auth/login').send(credentials)

    expect(response.body.user).not.toHaveProperty('passwordHash')
    expect(response.text).not.toContain(credentials.password)
    expect(response.text).not.toContain('$2b$')
  })

  it('responde igual a e-mail inexistente e a senha errada: 401 INVALID_CREDENTIALS', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'senha-errada-123' })
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'ninguem@exemplo.test' })

    expect(wrongPassword.status).toBe(401)
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS')
    // Mesmo status e mesmo corpo, inteiro: nada na resposta distingue os casos.
    expect(unknownEmail.status).toBe(wrongPassword.status)
    expect(unknownEmail.body).toEqual(wrongPassword.body)
  })

  it('recusa payload sem e-mail com 400, VALIDATION_ERROR e o campo em details', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: credentials.password })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('email')
  })
})
