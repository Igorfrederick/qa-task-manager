import mongoose from 'mongoose'

/**
 * Verifica a conexão UMA vez, antes de qualquer arquivo de teste.
 *
 * Sem isto, cada arquivo que abre conexão estoura o timeout do `beforeAll`
 * por conta própria: a suíte demora dezenas de segundos e termina com uma
 * pilha de "Hook timed out" que se lê como código quebrado, quando o que
 * falta é o banco.
 *
 * É o mesmo critério de `config/env.js`: falhar cedo, no lugar certo, com a
 * causa e o comando que resolve. A diferença entre ambiente ausente e código
 * quebrado tem de estar na mensagem, não na interpretação de quem lê.
 */

const TIMEOUT_MS = 3000

export async function setup() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/task-manager-test'

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: TIMEOUT_MS })
    await mongoose.disconnect()
  } catch {
    throw new Error(
      [
        '',
        `MongoDB não respondeu em ${uri} (${TIMEOUT_MS}ms).`,
        '',
        'A suíte do backend exercita o banco real: sem MongoDB em pé, nada roda.',
        '',
        'Suba o banco na raiz do repositório:',
        '',
        '  docker compose up -d',
        '',
        'Ou aponte MONGODB_URI para uma instância própria.',
        '',
      ].join('\n'),
    )
  }
}
