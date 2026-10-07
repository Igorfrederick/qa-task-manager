import bcrypt from 'bcrypt'

import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/errors.js'
import { signToken } from '../utils/token.js'

/**
 * Regra de negócio de autenticação. Não conhece `req` nem `res`.
 *
 * O contrato exige que e-mail inexistente e senha errada respondam igual, para
 * não revelar quais e-mails têm conta. Igual inclui o tempo: o bcrypt é a
 * parte lenta, e se ele só rodasse quando o e-mail existe, o e-mail
 * inexistente responderia mais rápido. Por isso, sem usuário, a senha é
 * comparada com um hash que nenhum usuário tem.
 */
const UNKNOWN_USER_HASH = bcrypt.hashSync('senha-que-nenhum-usuario-tem', env.bcryptSaltRounds)

/**
 * Confere a credencial e emite o token.
 *
 * @param {{ email: string, password: string }} credentials já validadas pelo schema
 * @returns {Promise<{ token: string, user: import('mongoose').Document }>}
 * @throws {AppError} `INVALID_CREDENTIALS`, o mesmo para e-mail inexistente e senha errada
 */
export async function authenticate({ email, password }) {
  // `+passwordHash`: o campo é `select: false`, e este é o único lugar que
  // precisa lê-lo. O `transform` do schema o remove quando o usuário for
  // serializado na resposta.
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? UNKNOWN_USER_HASH)
  if (!user || !passwordMatches) {
    throw new AppError('INVALID_CREDENTIALS')
  }

  return { token: signToken({ id: user.id, role: user.role }), user }
}
