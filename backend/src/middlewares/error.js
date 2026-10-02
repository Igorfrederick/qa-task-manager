import { env } from '../config/env.js'

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

/** Rota inexistente. Antes do handler de erro, na montagem do app. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      details: [],
    },
  })
}

// A assinatura de quatro parâmetros é o que faz o Express reconhecer isto como
// handler de erro; `next` fica sem uso e não pode ser removido.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  // Erro que carrega `status` e `code` foi lançado deliberadamente por uma
  // camada nossa — validação ou regra de domínio — e já sabe como se
  // apresentar. O middleware não precisa de mapa nem de adivinhação.
  if (error?.status && error?.code) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? [],
      },
    })
  }

  // JSON malformado: o express.json() lança antes de qualquer validador nosso.
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Corpo da requisição não é um JSON válido',
        details: [],
      },
    })
  }

  // Erro não previsto. A mensagem original não vai ao cliente: pode carregar
  // caminho de arquivo, nome de coleção ou trecho de payload.
  if (env.nodeEnv !== 'test') {
    console.error('Erro não tratado:', error)
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor',
      details: [],
    },
  })
}
