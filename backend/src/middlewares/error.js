import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

/**
 * Middleware de erro centralizado.
 *
 * Único lugar do backend que traduz erro para resposta HTTP. `try/catch`
 * repetido em controller é achado: cada bloco monta o corpo do erro à sua
 * maneira e o formato diverge entre rotas sem que ninguém perceba.
 *
 * O formato é o de `api_contract.md` §Formato de erro, sempre com os três
 * campos — `details` vem `[]` quando não se aplica, para que o consumidor não
 * precise testar a existência do campo.
 */

/**
 * Rota inexistente. Antes do handler de erro, na montagem do app.
 *
 * Encaminha em vez de responder: até o `404` de rota passa pelo handler
 * abaixo, e o corpo de erro tem um único lugar onde é escrito.
 */
export function notFoundHandler(_req, _res, next) {
  next(new AppError('NOT_FOUND'))
}

// A assinatura de quatro parâmetros é o que faz o Express reconhecer isto como
// handler de erro; `next` fica sem uso e não pode ser removido.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  // Lançado deliberadamente por uma camada nossa, com status e mensagem do
  // catálogo. `instanceof`, e não "tem `status` e `code`": erro do driver do
  // MongoDB também tem `code`, e não é nosso para apresentar.
  if (error instanceof AppError) {
    return sendError(res, error)
  }

  // JSON malformado: o express.json() lança antes de qualquer validador nosso.
  if (error?.type === 'entity.parse.failed') {
    return sendError(res, new AppError('VALIDATION_ERROR'))
  }

  // Erro não previsto. A mensagem original não vai ao cliente: pode carregar
  // caminho de arquivo, nome de coleção ou trecho de payload.
  if (env.nodeEnv !== 'test') {
    console.error('Erro não tratado:', error)
  }

  return sendError(res, new AppError('INTERNAL_ERROR'))
}

function sendError(res, { status, code, message, details }) {
  return res.status(status).json({ error: { code, message, details } })
}
