import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { env } from '../../src/config/env.js'
import { User } from '../../src/models/User.js'
import { authenticate } from '../../src/services/authService.js'
import { registerUser } from '../../src/services/userService.js'
import { AppError } from '../../src/utils/errors.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste do login SEM HTTP: o service confere a credencial e emite o token.
 */
describe('authService.authenticate', () => {
  const credentials = { email: 'fulana@exemplo.test', password: 'senha-de-teste-123' }
  let registered

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    registered = await registerUser({ name: 'Fulana de Teste', role: ROLES.QA, ...credentials })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('emite token assinado com o id em sub e expiração', async () => {
    const { token } = await authenticate(credentials)

    // Validado com o segredo e o algoritmo do projeto: um token que passa aqui
    // é um token que o middleware de autenticação vai aceitar.
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })

    expect(payload.sub).toBe(registered.id)
    expect(payload.exp).toBeGreaterThan(payload.iat)
    // Só o id: nem perfil — lido do banco a cada requisição —, nem e-mail,
    // nem nome, nem hash.
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub'])
  })

  it('devolve o usuário sem passwordHash na serialização', async () => {
    const { user } = await authenticate(credentials)

    expect(user.email).toBe(credentials.email)
    expect(user.toJSON()).not.toHaveProperty('passwordHash')
  })

  it('aceita o e-mail com maiúsculas e espaços', async () => {
    const { user } = await authenticate({ ...credentials, email: '  Fulana@Exemplo.TEST ' })

    expect(user.id).toBe(registered.id)
  })

  it('recusa senha errada com INVALID_CREDENTIALS e 401', async () => {
    const error = await authenticate({ ...credentials, password: 'senha-errada-123' }).catch(
      (e) => e,
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('INVALID_CREDENTIALS')
    expect(error.status).toBe(401)
  })

  it('roda o bcrypt mesmo quando o e-mail não existe, para o tempo não revelar a conta', async () => {
    // O bcrypt é a parte lenta do login. Se ele fosse pulado sem usuário, o
    // e-mail inexistente responderia mais rápido que a senha errada.
    const compare = vi.spyOn(bcrypt, 'compare')

    await authenticate({ ...credentials, email: 'ninguem@exemplo.test' }).catch(() => {})

    expect(compare).toHaveBeenCalledTimes(1)
    // E contra um hash com o custo de verdade: comparar com um hash barato
    // devolveria a diferença de tempo que a regra existe para esconder.
    const [, hash] = compare.mock.calls[0]
    expect(bcrypt.getRounds(hash)).toBe(env.bcryptSaltRounds)
  })

  it('recusa e-mail inexistente com o mesmo erro da senha errada', async () => {
    const error = await authenticate({ ...credentials, email: 'ninguem@exemplo.test' }).catch(
      (e) => e,
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('INVALID_CREDENTIALS')
    expect(error.status).toBe(401)
  })
})
