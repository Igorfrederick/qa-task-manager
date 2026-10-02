import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { User } from '../../src/models/User.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste da rota, com supertest e sem porta aberta.
 *
 * O que se afere aqui é o que o service não pode aferir: status HTTP, formato
 * do corpo e — principalmente — o que sai na resposta. O `201` sozinho não diz
 * nada sobre vazamento de hash.
 */
describe('POST /api/auth/register', () => {
  const app = createApp()

  const validPayload = {
    name: 'Fulana de Teste',
    email: 'fulana@exemplo.test',
    password: 'senha-de-teste-123',
  }

  beforeAll(async () => {
    await connectDatabase()
    await User.syncIndexes()
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('cadastra o usuário e responde 201', async () => {
    const response = await request(app).post('/api/auth/register').send(validPayload)

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      name: 'Fulana de Teste',
      email: 'fulana@exemplo.test',
      role: ROLES.QA,
    })
    expect(response.body.user._id).toBeTruthy()
  })

  it('NÃO devolve passwordHash no corpo da resposta', async () => {
    const response = await request(app).post('/api/auth/register').send(validPayload)

    expect(response.status).toBe(201)
    expect(response.body.user).not.toHaveProperty('passwordHash')
    // A senha em texto puro também não pode aparecer em lugar nenhum da
    // resposta, inclusive em campo com outro nome.
    expect(response.text).not.toContain(validPayload.password)
    expect(response.text).not.toContain('$2b$')
  })

  it('recusa e-mail já cadastrado com 409 e code EMAIL_TAKEN', async () => {
    await request(app).post('/api/auth/register').send(validPayload)

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, name: 'Outra Pessoa' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('EMAIL_TAKEN')
    expect(response.body.error.details).toEqual([])
    expect(await User.countDocuments()).toBe(1)
  })

  it('recusa payload inválido com 400, VALIDATION_ERROR e o campo em details', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'nao-e-email', password: '123' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')

    const fields = response.body.error.details.map((d) => d.field)
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']))
    expect(response.body.error.details[0]).toHaveProperty('issue')
    expect(await User.countDocuments()).toBe(0)
  })

  it('recusa perfil fora do catálogo com 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, role: 'admin' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('role')
  })

  it('ignora campo não declarado no schema em vez de persisti-lo', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, passwordHash: 'hash-injetado-pelo-cliente' })

    expect(response.status).toBe(201)

    const persisted = await User.findOne({ email: validPayload.email }).select(
      '+passwordHash',
    )
    expect(persisted.passwordHash).not.toBe('hash-injetado-pelo-cliente')
  })

  it('responde no formato único de erro, com code, message e details', async () => {
    const response = await request(app).post('/api/auth/register').send({})

    expect(response.body).toHaveProperty('error')
    expect(Object.keys(response.body.error).sort()).toEqual(['code', 'details', 'message'])
  })
})
