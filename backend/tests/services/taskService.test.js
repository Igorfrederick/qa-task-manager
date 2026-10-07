import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../../src/services/taskService.js'
import { registerUser } from '../../src/services/userService.js'
import { AppError } from '../../src/utils/errors.js'
import { ROLES } from '../../src/utils/roles.js'
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from '../../src/utils/taskLimits.js'

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

  describe('updateTask', () => {
    it('recusa descrição acima do limite mesmo sem o schema de entrada', async () => {
      // Chamado direto, como o seed chamará: quem barra é o model, pelo
      // runValidators da edição.
      const own = await Task.create({ title: 'Tarefa da QA', userId: qa.id })

      const error = await updateTask(authenticated(qa), own.id, {
        description: 'a'.repeat(TASK_DESCRIPTION_MAX_LENGTH + 1),
      }).catch((e) => e)

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError)
      expect((await Task.findById(own.id)).description).toBe('')
    })

    it('lança TASK_NOT_FOUND ao qa que edita a tarefa de outra pessoa, sem alterá-la', async () => {
      const foreign = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })

      const error = await updateTask(authenticated(qa), foreign.id, { title: 'Editada' }).catch(
        (e) => e,
      )

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('TASK_NOT_FOUND')
      expect((await Task.findById(foreign.id)).title).toBe('Tarefa da outra QA')
    })

    it('recusa status fora do domínio mesmo sem o schema de entrada', async () => {
      // Chamado direto, como o seed chamará: quem barra aqui é o
      // runValidators, não o Zod.
      const own = await Task.create({ title: 'Tarefa da QA', userId: qa.id })

      const error = await updateTask(authenticated(qa), own.id, { status: 'doing' }).catch((e) => e)

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError)
      expect((await Task.findById(own.id)).status).toBe('open')
    })

    it('mantém o dono quando os dados trazem userId de outra pessoa', async () => {
      const own = await Task.create({ title: 'Tarefa da QA', userId: qa.id })

      await updateTask(authenticated(qa), own.id, { title: 'Editada', userId: otherQa.id })

      expect((await Task.findById(own.id)).userId.toString()).toBe(qa.id)
    })
  })

  describe('deleteTask', () => {
    it('lança TASK_NOT_FOUND ao qa que exclui a tarefa de outra pessoa, sem excluí-la', async () => {
      const foreign = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })

      const error = await deleteTask(authenticated(qa), foreign.id).catch((e) => e)

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('TASK_NOT_FOUND')
      expect(await Task.exists({ _id: foreign.id })).toBeTruthy()
    })

    it('exclui a tarefa de outra pessoa quando o usuário é lead', async () => {
      const foreign = await Task.create({ title: 'Tarefa da outra QA', userId: otherQa.id })

      await deleteTask(authenticated(lead), foreign.id)

      expect(await Task.exists({ _id: foreign.id })).toBeNull()
    })
  })

  describe('createTask', () => {
    it('recusa título acima do limite mesmo sem o schema de entrada', async () => {
      const error = await createTask(authenticated(qa), {
        title: 'a'.repeat(TASK_TITLE_MAX_LENGTH + 1),
      }).catch((e) => e)

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError)
      expect(await Task.countDocuments()).toBe(0)
    })

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
