import { createTask, deleteTask, getTask, listTasks, updateTask } from '../services/taskService.js'

/**
 * Entrada e saída HTTP das rotas de tarefa. Nenhuma regra de negócio: repassa
 * ao service o usuário autenticado (`req.user`, montado pelo middleware) e a
 * entrada já validada, e devolve o resultado com o status do contrato.
 *
 * `.catch(next)` pelo mesmo motivo de `authController.js`: no Express 4, erro
 * em função assíncrona não chega sozinho ao middleware de erro.
 */
export function list(req, res, next) {
  listTasks(req.user, req.query)
    .then((tasks) => {
      res.status(200).json({ tasks })
    })
    .catch(next)
}

export function show(req, res, next) {
  getTask(req.user, req.params.id)
    .then((task) => {
      res.status(200).json({ task })
    })
    .catch(next)
}

export function update(req, res, next) {
  updateTask(req.user, req.params.id, req.body)
    .then((task) => {
      res.status(200).json({ task })
    })
    .catch(next)
}

/** `remove`, e não `delete`: `delete` é palavra reservada do JavaScript. */
export function remove(req, res, next) {
  deleteTask(req.user, req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(next)
}

export function create(req, res, next) {
  createTask(req.user, req.body)
    .then((task) => {
      res.status(201).json({ task })
    })
    .catch(next)
}
