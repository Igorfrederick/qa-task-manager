import { authenticate } from '../services/authService.js'
import { getAuthenticatedUser, registerUser } from '../services/userService.js'

/**
 * Entrada e saída HTTP das rotas de autenticação. Nenhuma regra de negócio.
 *
 * Sem `try/catch`: o handler é `async`, e erro em função assíncrona não chega
 * sozinho ao middleware de erro no Express 4 — por isso o `.catch(next)`. É
 * encaminhamento, não tratamento: nada aqui decide status nem monta corpo de
 * erro. Quem decide é quem lançou; quem escreve a resposta é o middleware.
 */
export function register(req, res, next) {
  registerUser(req.body)
    .then((user) => {
      // `res.json` chama `toJSON`, e o transform do schema remove
      // `passwordHash`. A remoção não depende de o controller lembrar dela.
      res.status(201).json({ user })
    })
    .catch(next)
}

export function login(req, res, next) {
  authenticate(req.body)
    .then(({ token, user }) => {
      res.status(200).json({ token, user })
    })
    .catch(next)
}

/**
 * `req.user` vem do middleware de autenticação e traz só `{ id, role }`; o
 * service busca o usuário completo para a resposta. É uma segunda leitura do
 * mesmo usuário, deliberada: `req.user` guarda só o que autoriza, como pede a
 * convenção, e não o documento do model.
 */
export function me(req, res, next) {
  getAuthenticatedUser(req.user.id)
    .then((user) => {
      res.status(200).json({ user })
    })
    .catch(next)
}
