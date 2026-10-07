import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { env } from '../../src/config/env.js'
import { User } from '../../src/models/User.js'
import { registerUser } from '../../src/services/userService.js'
import { ROLES } from '../../src/utils/roles.js'
import { signToken } from '../../src/utils/token.js'

/**
 * `GET /auth/me` e, por ela, o middleware de autenticação.
 *
 * Cada causa de `401` tem um teste que assere o `code` que só ela produz. Um
 * token montado errado no próprio teste não passa pelo motivo errado.
 */
describe('GET /api/auth/me', () => {
  const app = createApp()
  let user

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    user = await registerUser({
      name: 'Fulana de Teste',
      email: 'fulana@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.QA,
    })
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const getMe = (authorization) => {
    const call = request(app).get('/api/auth/me')
    return authorization ? call.set('Authorization', authorization) : call
  }

  it('responde 200 com o usuário do token, sem passwordHash', async () => {
    const response = await getMe(`Bearer ${signToken(user)}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ _id: user.id, email: user.email, role: ROLES.QA })
    expect(response.body.user).not.toHaveProperty('passwordHash')
  })

  it.each([
    ['sem header Authorization', undefined],
    ['com esquema diferente de Bearer', 'Basic dXN1YXJpbzpzZW5oYQ=='],
    ['com Bearer sem token', 'Bearer '],
  ])('responde 401 TOKEN_MISSING %s', async (_case, authorization) => {
    const response = await getMe(authorization)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
  })

  it.each([
    ['em formato que não é JWT', () => 'nao-e-um-jwt'],
    [
      'assinado com outro segredo',
      () => jwt.sign({ role: ROLES.LEAD }, 'outro-segredo', { algorithm: 'HS256', subject: user.id }),
    ],
    [
      'com sub que não é um id',
      () => jwt.sign({}, env.jwtSecret, { algorithm: 'HS256', subject: 'nao-e-um-id' }),
    ],
    [
      'assinado com outro algoritmo',
      () => jwt.sign({ role: ROLES.QA }, env.jwtSecret, { algorithm: 'HS512', subject: user.id }),
    ],
    [
      'sem assinatura (alg none)',
      () => {
        const encode = (part) => Buffer.from(JSON.stringify(part)).toString('base64url')
        return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: user.id, role: ROLES.LEAD })}.`
      },
    ],
  ])('responde 401 TOKEN_INVALID para token %s', async (_case, buildToken) => {
    const response = await getMe(`Bearer ${buildToken()}`)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_INVALID')
  })

  it('responde 401 TOKEN_EXPIRED para token com exp vencido', async () => {
    // Assinado com o segredo e o algoritmo certos: a única falha é o exp.
    const expired = jwt.sign(
      { role: ROLES.QA, exp: Math.floor(Date.now() / 1000) - 60 },
      env.jwtSecret,
      { algorithm: 'HS256', subject: user.id },
    )

    const response = await getMe(`Bearer ${expired}`)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_EXPIRED')
  })

  it('responde 401 TOKEN_INVALID para token de usuário que não existe mais', async () => {
    const token = signToken(user)
    await User.deleteOne({ _id: user.id })

    const response = await getMe(`Bearer ${token}`)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_INVALID')
  })
})
