import bcrypt from 'bcrypt'

import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { EmailTakenError } from '../utils/errors.js'

/**
 * Regra de negócio de usuário.
 *
 * Não conhece `req` nem `res`: recebe dados, devolve dados ou lança erro de
 * domínio. Exercitável sem HTTP e sem subir a aplicação — basta uma conexão
 * com o banco, aberta por `config/database.js`.
 *
 * O model é importado, não recebido por parâmetro. Modelo Mongoose é registro
 * global por nome (`mongoose.model('User')`): injetar por parâmetro não
 * permitiria substituição real, só deslocaria o import para quem chama, e
 * todos os chamadores passariam o mesmo objeto. Parâmetro com um valor
 * possível é cerimônia, e a convenção pede dependência externa por parâmetro
 * ou por `config/` — a dependência externa real aqui é a **conexão**, e ela já
 * vem de `config/`. O custo do teste de service é o banco de teste, não o
 * acoplamento ao model.
 *
 * O custo do bcrypt vem de `env`, nunca literal: a suíte roda com custo baixo
 * e produção com custo alto sem que o código mude.
 */

/**
 * Cadastra um usuário.
 *
 * @param {{ name: string, email: string, password: string, role?: string }} data
 *        já validados pelo schema Zod no middleware
 * @returns {Promise<import('mongoose').Document>} documento sem `passwordHash`
 * @throws {EmailTakenError} quando o e-mail já está cadastrado
 */
export async function registerUser({ name, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase()

  const alreadyExists = await User.exists({ email: normalizedEmail })
  if (alreadyExists) {
    throw new EmailTakenError(normalizedEmail)
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds)

  try {
    // create devolve o documento sem `passwordHash` selecionado; ainda assim o
    // transform do schema é a barreira que vale, porque não depende disto.
    return await User.create({ name, email: normalizedEmail, passwordHash, role })
  } catch (error) {
    // A consulta acima é verificação, não garantia: entre ela e a escrita cabe
    // outra requisição com o mesmo e-mail. Quem garante é o índice único do
    // schema, e sem isto a corrida viraria 500 em vez do 409 do contrato.
    if (error?.code === 11000) {
      throw new EmailTakenError(normalizedEmail)
    }
    throw error
  }
}
