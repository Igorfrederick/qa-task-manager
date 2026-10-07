import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import { Task } from '../../src/models/Task.js'
import { User } from '../../src/models/User.js'
import { registerUser } from '../../src/services/userService.js'

/**
 * As recusas de `npm run seed`, no processo de verdade: `run.js` executa ao
 * ser importado, então o teste o roda como o npm roda, num processo filho
 * apontado para o banco da suíte.
 *
 * Cada recusa confere que nada foi apagado — o que a recusa protege é a base,
 * e o código de saída sozinho não distingue "recusou" de "tentou e falhou".
 */
const RUN = fileURLToPath(new URL('../../src/seed/run.js', import.meta.url))
const exec = promisify(execFile)

function runSeed(env) {
  // Senhas vazias, e não ausentes: o dotenv não sobrescreve variável já
  // definida, e um backend/.env na máquina não preenche o que o teste esvaziou.
  return exec(process.execPath, [RUN], {
    env: { ...process.env, SEED_LEAD_PASSWORD: '', SEED_QA_PASSWORD: '', ...env },
  }).then(
    () => ({ exitCode: 0, stderr: '' }),
    (error) => ({ exitCode: error.code, stderr: error.stderr }),
  )
}

describe('npm run seed', () => {
  const passwords = { SEED_LEAD_PASSWORD: 'senha-do-lead-123', SEED_QA_PASSWORD: 'senha-da-qa-123' }

  beforeAll(async () => {
    await connectDatabase()
  })

  // Dado que o seed apagaria se rodasse.
  beforeEach(async () => {
    await registerUser({
      name: 'Pessoa Avulsa',
      email: 'avulsa@exemplo.test',
      password: 'senha-de-teste-123',
    })
  })

  // Tarefas também: se uma recusa regredir, o seed roda no banco da suíte e
  // deixa as tarefas dele, que quebrariam outros arquivos longe da causa.
  afterEach(async () => {
    await Task.deleteMany({})
    await User.deleteMany({})
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('recusa NODE_ENV=production sem tocar na base', async () => {
    // Senhas presentes: a única razão para recusar é o ambiente.
    const result = await runSeed({ ...passwords, NODE_ENV: 'production' })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('NODE_ENV=production')
    expect(await User.exists({ email: 'avulsa@exemplo.test' })).not.toBeNull()
  }, 15000)

  it('recusa rodar sem as senhas, sem tocar na base', async () => {
    const result = await runSeed({
      NODE_ENV: 'development',
      SEED_LEAD_PASSWORD: passwords.SEED_LEAD_PASSWORD,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('SEED_QA_PASSWORD')
    expect(await User.exists({ email: 'avulsa@exemplo.test' })).not.toBeNull()
  }, 15000)
})
