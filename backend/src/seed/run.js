import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { seedDatabase } from './seedDatabase.js'

/**
 * Entrada do `npm run seed`. É para o seed o que `server.js` é para a API:
 * confere o ambiente, conecta, roda e encerra a conexão. O que o seed cria
 * fica em `seedDatabase.js`, testável sem nada disto.
 */
async function run() {
  // O seed apaga usuários e tarefas antes de recriá-los.
  if (env.nodeEnv === 'production') {
    throw new Error('O seed apaga a base e não roda com NODE_ENV=production.')
  }

  if (!env.seedLeadPassword || !env.seedQaPassword) {
    throw new Error(
      'Defina SEED_LEAD_PASSWORD e SEED_QA_PASSWORD no backend/.env — consulte backend/.env.example.',
    )
  }

  await connectDatabase()
  try {
    const { users, tasks } = await seedDatabase({
      leadPassword: env.seedLeadPassword,
      qaPassword: env.seedQaPassword,
    })
    // Sem senha no log: só quem foi criado e quantas tarefas.
    console.log(`Seed concluído: ${users.join(', ')} e ${tasks} tarefas.`)
  } finally {
    await disconnectDatabase()
  }
}

run().catch((error) => {
  console.error(error.message, error.cause?.message ?? '')
  process.exit(1)
})
