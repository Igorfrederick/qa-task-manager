import dotenv from 'dotenv'

dotenv.config()

/**
 * Leitura e validação das variáveis de ambiente.
 *
 * A validação acontece na importação deste módulo: se faltar variável
 * obrigatória, a aplicação falha aqui, com a lista do que falta, em vez de
 * falhar mais tarde com um erro que não diz o que aconteceu.
 *
 * Nenhum valor padrão para segredo. Porta e ambiente têm padrão porque errar
 * neles é inconveniente; errar em JWT_SECRET é falha de segurança.
 */

const REQUIRED_VARIABLES = ['MONGODB_URI', 'JWT_SECRET']

const missing = REQUIRED_VARIABLES.filter((key) => !process.env[key])

if (missing.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}. ` +
      'Consulte backend/.env.example.',
  )
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export const env = {
  port: toInteger(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  bcryptSaltRounds: toInteger(process.env.BCRYPT_SALT_ROUNDS, 10),
  // Senhas dos usuários do seed. Fora das obrigatórias: a API sobe sem elas,
  // e só o `npm run seed` as exige — ele recusa rodar sem as duas.
  seedLeadPassword: process.env.SEED_LEAD_PASSWORD,
  seedQaPassword: process.env.SEED_QA_PASSWORD,
}
