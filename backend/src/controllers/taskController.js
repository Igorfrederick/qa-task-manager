import { createTask } from '../services/taskService.js'

/**
 * Entrada e saída HTTP das rotas de tarefa. Nenhuma regra de negócio: repassa
 * ao service o usuário autenticado (`req.user`, montado pelo middleware) e a
 * entrada já validada, e devolve o resultado com o status do contrato.
 *
 * `.catch(next)` pelo mesmo motivo de `authController.js`: no Express 4, erro
 * em função assíncrona não chega sozinho ao middleware de erro.
 */
export function create(req, res, next) {
  createTask(req.user, req.body)
    .then((task) => {
      res.status(201).json({ task })
    })
    .catch(next)
}
