import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { seedDatabase } from '../../src/seed/seedDatabase.js'
import { authenticate } from '../../src/services/authService.js'
import { registerUser } from '../../src/services/userService.js'
import { ROLES } from '../../src/utils/roles.js'
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from '../../src/utils/taskEnums.js'

/**
 * O seed sem `npm run seed`: a função chamada direto, contra o banco de teste.
 *
 * O que o E2E e quem sobe o projeto consomem é o que se afere aqui: os três
 * usuários entram pelo login com as senhas recebidas, cada um tem tarefas, e
 * rodar de novo devolve a base ao mesmo estado.
 */
describe('seedDatabase', () => {
  const passwords = { leadPassword: 'senha-do-lead-123', qaPassword: 'senha-da-qa-123' }

  beforeAll(async () => {
    await connectDatabase()
  })

  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('cria um lead e dois qa', async () => {
    await seedDatabase(passwords)

    const users = await User.find().sort({ email: 1 })
    expect(users.map((user) => [user.email, user.role])).toEqual([
      ['lead@exemplo.test', ROLES.LEAD],
      ['qa2@exemplo.test', ROLES.QA],
      ['qa@exemplo.test', ROLES.QA],
    ])
  })

  it.each([
    ['lead@exemplo.test', passwords.leadPassword],
    ['qa@exemplo.test', passwords.qaPassword],
    ['qa2@exemplo.test', passwords.qaPassword],
  ])('deixa %s entrar pelo login com a senha recebida', async (email, password) => {
    await seedDatabase(passwords)

    const { token, user } = await authenticate({ email, password })

    expect(token).toEqual(expect.any(String))
    expect(user.email).toBe(email)
  })

  it('cria tarefas para cada um dos três, nenhuma sem dono', async () => {
    await seedDatabase(passwords)

    const users = await User.find()
    for (const user of users) {
      expect(await Task.countDocuments({ userId: user._id }), user.email).toBeGreaterThan(0)
    }

    const userIds = users.map((user) => user.id)
    const owners = await Task.distinct('userId')
    expect(owners.every((ownerId) => userIds.includes(ownerId.toString()))).toBe(true)
  })

  it('cobre todos os status e prioridades, para os filtros terem o que mostrar', async () => {
    await seedDatabase(passwords)

    expect((await Task.distinct('status')).sort()).toEqual([...TASK_STATUS_VALUES].sort())
    expect((await Task.distinct('priority')).sort()).toEqual([...TASK_PRIORITY_VALUES].sort())
  })

  it('recria a base a cada execução, sem duplicar e sem sobras de antes', async () => {
    // Dado anterior ao seed, que ele não recria: tem de sumir junto.
    const stranger = await registerUser({
      name: 'Pessoa Avulsa',
      email: 'avulsa@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.QA,
    })
    await Task.create({ title: 'Tarefa avulsa', userId: stranger.id })

    const first = await seedDatabase(passwords)
    const second = await seedDatabase(passwords)

    expect(second).toEqual(first)
    expect(await User.countDocuments()).toBe(first.users.length)
    expect(await Task.countDocuments()).toBe(first.tasks)
    expect(await User.exists({ email: 'avulsa@exemplo.test' })).toBeNull()
    expect(await Task.exists({ title: 'Tarefa avulsa' })).toBeNull()
  })

  it.each([
    ['curta demais', 'curta'],
    ['acima de 72 bytes', 'ç'.repeat(40)],
  ])('recusa senha %s, como a API, sem apagar a base', async (_case, password) => {
    const stranger = await registerUser({
      name: 'Pessoa Avulsa',
      email: 'avulsa@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.QA,
    })

    await expect(seedDatabase({ ...passwords, qaPassword: password })).rejects.toThrow('Senha do qa')

    expect(await User.exists({ _id: stranger._id })).not.toBeNull()
    expect(await User.exists({ email: 'lead@exemplo.test' })).toBeNull()
  })
})
