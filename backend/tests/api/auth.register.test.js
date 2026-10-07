import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { env } from '../../src/config/env.js'
import { User } from '../../src/models/User.js'
import { ROLES } from '../../src/utils/roles.js'
import { createUserWithToken } from '../helpers/users.js'

/**
 * Teste da rota, com supertest e sem porta aberta.
 *
 * O que se afere aqui é o que o service não pode aferir: quem pode chamar a
 * rota, status HTTP, formato do corpo e — principalmente — o que sai na
 * resposta. O `201` sozinho não diz nada sobre vazamento de hash.
 */
describe('POST /api/auth/register', () => {
  const app = createApp()

  const validPayload = {
    name: 'Fulana de Teste',
    email: 'fulana@exemplo.test',
    password: 'senha-de-teste-123',
  }

  let leadToken
  let qaToken

  beforeAll(async () => {
    await connectDatabase()
    await User.syncIndexes()
  })

  // Criação de conta é exclusiva do líder: cada teste nasce com um `lead` e
  // um `qa`, criados pelo service, e com o token de cada um.
  beforeEach(async () => {
    const lead = await createUserWithToken({
      name: 'Líder de Teste',
      email: 'lead@exemplo.test',
      role: ROLES.LEAD,
    })
    const qa = await createUserWithToken({
      name: 'QA de Teste',
      email: 'qa@exemplo.test',
      role: ROLES.QA,
    })
    leadToken = lead.token
    qaToken = qa.token
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const postRegister = (payload, token = leadToken) =>
    request(app).post('/api/auth/register').set('Authorization', `Bearer ${token}`).send(payload)

  it('cadastra o usuário e responde 201', async () => {
    const response = await postRegister(validPayload)

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      name: 'Fulana de Teste',
      email: 'fulana@exemplo.test',
      role: ROLES.QA,
    })
    expect(response.body.user._id).toBeTruthy()
  })

  it('cria conta de lead quando o líder informa o perfil', async () => {
    const response = await postRegister({ ...validPayload, role: ROLES.LEAD })

    expect(response.status).toBe(201)
    expect(response.body.user.role).toBe(ROLES.LEAD)
  })

  it('NÃO devolve token nem passwordHash no corpo da resposta', async () => {
    const response = await postRegister(validPayload)

    expect(response.status).toBe(201)
    // Quem cria a conta de outra pessoa não recebe a credencial dela.
    expect(response.body).not.toHaveProperty('token')
    expect(response.body.user).not.toHaveProperty('passwordHash')
    // A senha em texto puro também não pode aparecer em lugar nenhum da
    // resposta, inclusive em campo com outro nome.
    expect(response.text).not.toContain(validPayload.password)
    expect(response.text).not.toContain('$2b$')
  })

  it('responde 401 TOKEN_MISSING sem token e não cria a conta', async () => {
    const response = await request(app).post('/api/auth/register').send(validPayload)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_MISSING')
    expect(await User.countDocuments({ email: validPayload.email })).toBe(0)
  })

  it('responde 403 FORBIDDEN ao qa e não cria a conta', async () => {
    const response = await postRegister(validPayload, qaToken)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
    expect(await User.countDocuments({ email: validPayload.email })).toBe(0)
  })

  it('responde 401 TOKEN_INVALID ao token de um lead que não existe mais', async () => {
    // O token é válido — assinatura e exp —, mas o usuário dele foi removido:
    // nenhuma rota pode aceitá-lo, e esta é a que mais importa.
    await User.deleteOne({ email: 'lead@exemplo.test' })

    const response = await postRegister(validPayload)

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('TOKEN_INVALID')
    expect(await User.countDocuments({ email: validPayload.email })).toBe(0)
  })

  it('autoriza pelo perfil do banco, não pelo perfil escrito no token', async () => {
    // Token bem assinado para o qa, mas declarando role lead. O token do
    // projeto não carrega perfil; este é montado à mão para provar que, se
    // carregasse, não seria ele a decidir. Vale o perfil atual do usuário.
    const qa = await User.findOne({ email: 'qa@exemplo.test' })
    const staleToken = jwt.sign({ role: ROLES.LEAD }, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
      subject: qa.id,
    })

    const response = await postRegister(validPayload, staleToken)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('responde 403 ao qa antes de validar o payload', async () => {
    // Autorização antes da validação: quem não pode criar conta não recebe o
    // 400 com os campos do schema.
    const response = await postRegister({ name: 'A' }, qaToken)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('recusa e-mail já cadastrado com 409 e code EMAIL_TAKEN', async () => {
    await postRegister(validPayload)

    const response = await postRegister({ ...validPayload, name: 'Outra Pessoa' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('EMAIL_TAKEN')
    expect(response.body.error.details).toEqual([])
    expect(await User.countDocuments({ email: validPayload.email })).toBe(1)
  })

  it('recusa payload inválido com 400, VALIDATION_ERROR e o campo em details', async () => {
    const response = await postRegister({ name: 'A', email: 'nao-e-email', password: '123' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')

    const fields = response.body.error.details.map((d) => d.field)
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']))
    expect(response.body.error.details[0]).toHaveProperty('issue')
    expect(await User.countDocuments({ email: 'nao-e-email' })).toBe(0)
  })

  it('recusa senha acima de 72 bytes, mesmo com menos de 72 caracteres', async () => {
    // 37 caracteres, 73 bytes: um byte além do limite, e o bcrypt ignoraria o
    // último. Na fronteira, para que um limite frouxo também quebre o teste.
    const response = await postRegister({ ...validPayload, password: 'ç'.repeat(36) + 'a' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('password')
    expect(await User.countDocuments({ email: validPayload.email })).toBe(0)
  })

  it('aceita senha de exatamente 72 bytes, com acentos', async () => {
    const response = await postRegister({ ...validPayload, password: 'ç'.repeat(36) })

    expect(response.status).toBe(201)
  })

  it('recusa perfil fora do catálogo com 400', async () => {
    const response = await postRegister({ ...validPayload, role: 'admin' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details.map((d) => d.field)).toContain('role')
  })

  it('ignora campo não declarado no schema em vez de persisti-lo', async () => {
    const response = await postRegister({
      ...validPayload,
      passwordHash: 'hash-injetado-pelo-cliente',
    })

    expect(response.status).toBe(201)

    const persisted = await User.findOne({ email: validPayload.email }).select('+passwordHash')
    expect(persisted.passwordHash).not.toBe('hash-injetado-pelo-cliente')
  })

  it('responde no formato único de erro, com code, message e details', async () => {
    const response = await postRegister({})

    expect(response.body).toHaveProperty('error')
    expect(Object.keys(response.body.error).sort()).toEqual(['code', 'details', 'message'])
  })
})
