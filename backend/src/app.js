import express from 'express'

import { errorHandler, notFoundHandler } from './middlewares/error.js'
import { apiRouter } from './routes/index.js'

/**
 * Aplicação Express, sem listen.
 *
 * Separada de server.js para que a suíte de teste exercite a API com supertest
 * sem abrir porta. Quem chama listen é o server.js.
 *
 * A ordem da montagem é significativa: rotas primeiro, depois o 404 para o que
 * nenhuma rota atendeu, e o handler de erro por último — ele precisa estar
 * depois de tudo que pode lançar.
 */
export function createApp() {
  const app = express()

  app.use(express.json())

  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
