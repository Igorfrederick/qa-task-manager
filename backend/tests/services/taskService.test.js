import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { createTask, getTask, listTasks } from '../../src/services/taskService.js'
import { registerUser } from '../../src/services/userService.js'
import { AppError } from '../../src/utils/errors.js'
import { ROLES } from '../../src/utils/roles.js'

/**
 * Teste do service de tarefa SEM HTTP e SEM subir a aplicação.
 *
 * O service recebe o usuário autenticado como o middleware o monta —
 * `{ id, role }` —, e é aqui que o escopo por dono se prova sem depender de
 * rota: as regras 2 e 3 são do service, não do controller.
 */
describe('taskService', () => {
  let lead
  let qa
  let otherQa

  /** O usuário autenticado como `requireAuth` o entrega em `req.user`. */
  const authenticated = (user) => ({ id: user.id, role: user.role })

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    lead = await registerUser({
      name: 'Líder de Teste',
      email: 'lead@exemplo.test',
      password: 'senha-de-teste-123',
      role: ROLES.LEAD,
    })
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

  describe('listTasks', () => {
    beforeEach(async () => {
      await Task.create({ title: 'Tarefa da QA', userId: qa.id })
      await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })
    })

    it('filtra pelo dono na consulta quando o usuário é qa', async () => {
      const tasks = await listTasks(authenticated(qa))

      expect(tasks.map((task) => task.title)).toEqual(['Tarefa da QA'])
    })

    it('não filtra pelo dono quando o usuário é lead', async () => {
      const tasks = await listTasks(authenticated(lead))

      expect(tasks.map((task) => task.title)).toEqual(['Tarefa da outra QA', 'Tarefa da QA'])
    })

    it('mantém o escopo do qa quando há filtro', async () => {
      // As duas tarefas estão abertas: o filtro sozinho traria as duas.
      const tasks = await listTasks(authenticated(qa), { status: 'open' })

      expect(tasks.map((task) => task.title)).toEqual(['Tarefa da QA'])
    })
  })

  describe('getTask', () => {
    it('lança TASK_NOT_FOUND quando o qa pede a tarefa de outra pessoa', async () => {
      const foreign = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })

      const error = await getTask(authenticated(qa), foreign.id).catch((e) => e)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('TASK_NOT_FOUND')
    })

    it('devolve ao lead a tarefa de outra pessoa', async () => {
      const foreign = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })

      const task = await getTask(authenticated(lead), foreign.id)

      expect(task.title).toBe('Tarefa da outra QA')
    })
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
