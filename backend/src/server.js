import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'

/**
 * Ponto de entrada. Conecta ao banco antes de aceitar requisição: sem banco,
 * o processo encerra com erro em vez de responder 500 a cada chamada.
 */
async function start() {
  try {
    await connectDatabase()
  } catch (error) {
    console.error(error.message, error.cause?.message ?? '')
    process.exit(1)
  }

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`API ouvindo na porta ${env.port} [${env.nodeEnv}]`)
  })

  // server.close() devolve o próprio servidor, não uma Promise: sem envolvê-lo
  // assim, o await abaixo não espera nada e o process.exit corta requisição em voo.
  let shuttingDown = false
  const shutdown = async () => {
    if (shuttingDown) return
    shuttingDown = true

    await new Promise((resolve) => server.close(resolve))
    await disconnectDatabase()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start()
