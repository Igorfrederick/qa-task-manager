import { Task } from '../models/Task.js'
import { AppError } from '../utils/errors.js'
import { ROLES } from '../utils/roles.js'

/**
 * Regra de negócio de tarefa.
 *
 * Recebe o usuário autenticado como dado — `{ id, role }`, montado pelo
 * middleware de autenticação e repassado pelo controller —, nunca `req`.
 * Exercitável sem HTTP e sem subir a aplicação.
 */

/** Do dono, a resposta expõe só o nome, além do `_id`. */
const OWNER_FIELDS = 'name'

/**
 * Escopo por dono, que entra na própria consulta (regra 2).
 *
 * O `lead` alcança as tarefas de todo o time; o `qa`, só as próprias. Toda
 * consulta de tarefa parte deste filtro: não há busca seguida de comparação do
 * dono, e por isso não há rota em que a comparação possa ser esquecida.
 */
function ownerScope(user) {
  return user.role === ROLES.LEAD ? {} : { userId: user.id }
}

/**
 * Tarefas que o usuário alcança, da mais recente para a mais antiga,
 * opcionalmente filtradas por status e prioridade.
 *
 * O escopo é espalhado por último: nenhum filtro sobrescreve o dono, mesmo
 * que um dia o schema de query passe a aceitar outro campo.
 *
 * A ordem é fixa: ordenação configurável está fora do escopo do v1. O `_id`
 * desempata tarefas criadas no mesmo milissegundo.
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @param {{ status?: string, priority?: string }} [filters] já validados pelo
 *        schema Zod no middleware
 * @returns {Promise<import('mongoose').Document[]>} tarefas com `owner` preenchido
 */
export async function listTasks(user, filters = {}) {
  return Task.find({ ...filters, ...ownerScope(user) })
    .sort({ createdAt: -1, _id: -1 })
    .populate('owner', OWNER_FIELDS)
}

/**
 * Uma tarefa que o usuário alcança.
 *
 * Para o `qa`, tarefa de outra pessoa e tarefa que não existe percorrem o
 * mesmo caminho: a consulta com o escopo não encontra nada, e o erro é o mesmo
 * (regra 2).
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @param {string} id já validado no formato pelo schema de parâmetro
 * @returns {Promise<import('mongoose').Document>} tarefa com `owner` preenchido
 * @throws {AppError} `TASK_NOT_FOUND` quando a tarefa não existe para quem pede
 */
export async function getTask(user, id) {
  const task = await Task.findOne({ _id: id, ...ownerScope(user) }).populate('owner', OWNER_FIELDS)
  if (!task) {
    throw new AppError('TASK_NOT_FOUND')
  }
  return task
}

/**
 * Edita os campos enviados de uma tarefa que o usuário alcança.
 *
 * Busca e escrita numa operação só, com o escopo na consulta: para o `qa`, a
 * tarefa de outra pessoa não é encontrada e, por isso, não é alterada
 * (regra 2). Os campos são lidos um a um, como na criação, e `userId` não está
 * entre eles: editar não transfere a tarefa, nem quando quem edita é o `lead`.
 *
 * Campo não enviado chega como `undefined`, e o Mongoose descarta chave
 * `undefined` no update: o que não foi enviado fica como está.
 * `runValidators` aplica os enums do schema também na edição — por padrão, o
 * Mongoose só os confere na criação.
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @param {string} id já validado no formato pelo schema de parâmetro
 * @param {{ title?: string, description?: string, status?: string, priority?: string }} changes
 *        já validados pelo schema Zod no middleware
 * @returns {Promise<import('mongoose').Document>} tarefa editada, com `owner` preenchido
 * @throws {AppError} `TASK_NOT_FOUND` quando a tarefa não existe para quem pede
 */
export async function updateTask(user, id, { title, description, status, priority }) {
  const task = await Task.findOneAndUpdate(
    { _id: id, ...ownerScope(user) },
    { title, description, status, priority },
    { new: true, runValidators: true },
  ).populate('owner', OWNER_FIELDS)
  if (!task) {
    throw new AppError('TASK_NOT_FOUND')
  }
  return task
}

/**
 * Exclui uma tarefa que o usuário alcança.
 *
 * Mesmo escopo da leitura e da edição, na própria consulta: para o `qa`, a
 * tarefa de outra pessoa não é encontrada e, por isso, não é excluída
 * (regra 2).
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @param {string} id já validado no formato pelo schema de parâmetro
 * @throws {AppError} `TASK_NOT_FOUND` quando a tarefa não existe para quem pede
 */
export async function deleteTask(user, id) {
  const { deletedCount } = await Task.deleteOne({ _id: id, ...ownerScope(user) })
  if (deletedCount === 0) {
    throw new AppError('TASK_NOT_FOUND')
  }
}

/**
 * Cria a tarefa em nome de quem pede.
 *
 * O dono é o usuário autenticado (regra 3). Os campos são lidos um a um, e
 * `userId` não está entre eles: um `userId` nos dados não chega à escrita,
 * mesmo que o service seja chamado sem passar pelo schema de entrada.
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @param {{ title: string, description?: string, status?: string, priority?: string }} data
 *        já validados pelo schema Zod no middleware
 * @returns {Promise<import('mongoose').Document>} tarefa com `owner` preenchido
 */
export async function createTask(user, { title, description, status, priority }) {
  const task = await Task.create({ title, description, status, priority, userId: user.id })
  return task.populate('owner', OWNER_FIELDS)
}
