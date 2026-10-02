import bcrypt from 'bcrypt'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { User } from '../../src/models/User.js'
import { registerUser } from '../../src/services/userService.js'
import { EmailTakenError } from '../../src/utils/errors.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste do service SEM HTTP e SEM subir a aplicação.
 *
 * Nada aqui importa `app.js`, `supertest` ou router. O que está em jogo é a
 * regra de negócio: o service recebe dados e devolve dados ou lança erro de
 * domínio. Se este arquivo precisasse de requisição para rodar, a camada
 * estaria quebrada.
 *
 * A conexão vem de `config/database.js`, que é a dependência externa entrando
 * por `config/` em vez de ser aberta dentro da regra.
 */
describe('userService.registerUser', () => {
  beforeAll(async () => {
    await connectDatabase()
    // Garante que o índice único de email existe antes do teste de corrida:
    // o Mongoose cria índice em background e a primeira escrita pode chegar
    // antes dele.
    await User.syncIndexes()
  })

  // Cada teste começa da coleção vazia: independência não pode depender de
  // ordem de execução.
  afterEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('cadastra o usuário e persiste com o perfil informado', async () => {
    const user = await registerUser({
      name: 'Fulana de Teste',
      email: 'fulana@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.LEAD,
    })

    expect(user.name).toBe('Fulana de Teste')
    expect(user.email).toBe('fulana@exemplo.test')
    expect(user.role).toBe(ROLES.LEAD)
    expect(await User.countDocuments()).toBe(1)
  })

  it('assume o perfil qa quando o cadastro não informa role', async () => {
    const user = await registerUser({
      name: 'Beltrano de Teste',
      email: 'beltrano@exemplo.test',
      password: 'senha-de-teste-123',
    })

    expect(user.role).toBe(ROLES.QA)
  })

  it('guarda a senha com hash bcrypt, nunca em texto puro', async () => {
    const password = 'senha-de-teste-123'

    await registerUser({
      name: 'Cicrana de Teste',
      email: 'cicrana@exemplo.test',
      password,
    })

    // select: false esconde o campo; aqui pedimos explicitamente, porque o que
    // se afere é justamente o que foi gravado.
    const persisted = await User.findOne({ email: 'cicrana@exemplo.test' }).select(
      '+passwordHash',
    )

    expect(persisted.passwordHash).toBeTruthy()
    expect(persisted.passwordHash).not.toBe(password)
    expect(await bcrypt.compare(password, persisted.passwordHash)).toBe(true)
  })

  it('normaliza o e-mail para minúsculas antes de gravar', async () => {
    const user = await registerUser({
      name: 'Dicrano de Teste',
      email: '  Dicrano@Exemplo.TEST  ',
      password: 'senha-de-teste-123',
    })

    expect(user.email).toBe('dicrano@exemplo.test')
  })

  it('recusa e-mail já cadastrado com EmailTakenError, code EMAIL_TAKEN e 409', async () => {
    const data = {
      name: 'Fulana de Teste',
      email: 'repetida@exemplo.test',
      password: 'senha-de-teste-123',
    }

    await registerUser(data)

    // rejects.toThrow não afere `code` nem `status`, que são o contrato.
    const error = await registerUser({ ...data, name: 'Outra Pessoa' }).catch((e) => e)

    expect(error).toBeInstanceOf(EmailTakenError)
    expect(error.code).toBe('EMAIL_TAKEN')
    expect(error.status).toBe(409)
    expect(await User.countDocuments()).toBe(1)
  })

  it('trata o e-mail repetido como duplicado mesmo variando as maiúsculas', async () => {
    await registerUser({
      name: 'Fulana de Teste',
      email: 'maiuscula@exemplo.test',
      password: 'senha-de-teste-123',
    })

    const error = await registerUser({
      name: 'Outra Pessoa',
      email: 'MAIUSCULA@exemplo.test',
      password: 'senha-de-teste-123',
    }).catch((e) => e)

    expect(error).toBeInstanceOf(EmailTakenError)
  })

  it('devolve EMAIL_TAKEN quando dois cadastros simultâneos disputam o mesmo e-mail', async () => {
    // A consulta de existência não protege contra corrida; quem protege é o
    // índice único. Sem o tratamento do erro 11000 no service, este caso
    // devolveria 500 em vez do 409 do contrato.
    const data = {
      name: 'Fulana de Teste',
      email: 'corrida@exemplo.test',
      password: 'senha-de-teste-123',
    }

    const results = await Promise.allSettled([
      registerUser(data),
      registerUser({ ...data, name: 'Outra Pessoa' }),
    ])

    const rejected = results.filter((r) => r.status === 'rejected')

    expect(rejected).toHaveLength(1)
    expect(rejected[0].reason).toBeInstanceOf(EmailTakenError)
    expect(await User.countDocuments()).toBe(1)
  })

  it('remove passwordHash na serialização, em toJSON e em toObject', async () => {
    await registerUser({
      name: 'Fulana de Teste',
      email: 'serializa@exemplo.test',
      password: 'senha-de-teste-123',
    })

    // Documento com o hash carregado de propósito: é o caminho que select:false
    // não cobre, e exatamente o que o transform existe para proteger.
    const withHash = await User.findOne({ email: 'serializa@exemplo.test' }).select(
      '+passwordHash',
    )

    expect(withHash.passwordHash).toBeTruthy()
    expect(withHash.toJSON()).not.toHaveProperty('passwordHash')
    expect(withHash.toObject()).not.toHaveProperty('passwordHash')
    expect(JSON.stringify(withHash)).not.toContain('$2b$')
  })
})
