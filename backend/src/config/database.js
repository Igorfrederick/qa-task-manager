import mongoose from 'mongoose'

import { env } from './env.js'

/**
 * Conexão com o MongoDB.
 *
 * Único lugar do backend que abre ou fecha conexão. Service, controller e
 * model recebem o Mongoose já conectado e não conhecem a URI.
 */

/**
 * Conecta ao banco. A falha é explícita e propaga: quem chama decide o que
 * fazer. O servidor encerra o processo; a suíte de teste falha o setup.
 * A aplicação nunca sobe silenciosamente sem banco.
 */
export async function connectDatabase(uri = env.mongodbUri) {
  try {
    await mongoose.connect(uri)
    return mongoose.connection
  } catch (error) {
    // cause preserva o erro do driver — MongooseServerSelectionError carrega
    // em .reason o detalhe por servidor, que a mensagem sozinha perde.
    throw new Error(`Falha ao conectar ao MongoDB: ${error.message}`, { cause: error })
  }
}

/**
 * Encerra a conexão. Existe para que a suíte de teste termine em vez de ficar
 * pendurada com o socket aberto, e para o desligamento controlado do servidor.
 */
export async function disconnectDatabase() {
  await mongoose.disconnect()
}
