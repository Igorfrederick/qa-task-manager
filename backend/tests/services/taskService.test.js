import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { createTask } from '../../src/services/taskService.js'
import { registerUser } from '../../src/services/userService.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste do service de tarefa SEM HTTP e SEM subir a aplicação.
 *
 * O service recebe o usuário autenticado como o middleware o monta —
 * `{ id, role }` —, e é aqui que o escopo por dono se prova sem depender de
 * rota: as regras 2 e 3 são do service, não do controller.
 */
describe('taskService', () => {
  let qa
  let otherQa

  /** O usuário autenticado como `requireAuth` o entrega em `req.user`. */
  const authenticated = (user) => ({ id: user.id, role: user.role })

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    qa = await registerUser({
      name: 'QA de Teste',
      email: 'qa@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.QA,
    })
    otherQa = await registerUser({
      name: 'Outra QA de Teste',
      email: 'outra-qa@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.QA,
    })
  })

  // Cada teste começa das coleções vazias: independência não pode depender de
  // ordem de execução.
  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  describe('createTask', () => {
    it('grava o usuário autenticado como dono, ignorando userId nos dados', async () => {
      // Chamado direto, sem o schema de entrada que descartaria o campo: o
      // service sozinho já garante a regra 3.
      const task = await createTask(authenticated(qa), {
        title: 'Tarefa em nome alheio',
        userId: otherQa.id,
      })

      const persisted = await Task.findById(task._id)
      expect(persisted.userId.toString()).toBe(qa.id)
    })

    it('devolve a tarefa com o dono preenchido', async () => {
      const task = await createTask(authenticated(qa), { title: 'Revisar plano de testes' })

      expect(task.owner._id.toString()).toBe(qa.id)
      expect(task.owner.name).toBe('QA de Teste')
    })
  })
})
