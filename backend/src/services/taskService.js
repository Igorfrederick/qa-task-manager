import { Task } from '../models/Task.js'
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
 * Tarefas que o usuário alcança, da mais recente para a mais antiga.
 *
 * A ordem é fixa: ordenação configurável está fora do escopo do v1. O `_id`
 * desempata tarefas criadas no mesmo milissegundo.
 *
 * @param {{ id: string, role: string }} user usuário autenticado
 * @returns {Promise<import('mongoose').Document[]>} tarefas com `owner` preenchido
 */
export async function listTasks(user) {
  return Task.find(ownerScope(user))
    .sort({ createdAt: -1, _id: -1 })
    .populate('owner', OWNER_FIELDS)
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
