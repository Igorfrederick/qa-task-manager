import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { AppError } from './errors.js'

/**
 * Geração e validação do JWT.
 *
 * Segredo, expiração e algoritmo vêm de um lugar só, porque a geração (login)
 * e a validação (middleware de autenticação) precisam concordar nos três. O
 * algoritmo é explícito nas duas pontas para que a regra não dependa do padrão
 * da biblioteca: a validação aceita HS256 e nada mais.
 *
 * O payload carrega só o id do usuário, em `sub` — a claim padrão de sujeito.
 * O perfil não vai no token: o middleware o lê do banco a cada requisição, e
 * um perfil copiado no token não seria lido por ninguém.
 */
const ALGORITHM = 'HS256'

/** @param {{ id: string }} user */
export function signToken({ id }) {
  return jwt.sign({}, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtExpiresIn,
    subject: String(id),
  })
}

/**
 * Valida o token e devolve o id do usuário.
 *
 * A falha sai como `AppError`, com o `code` da causa, e quem chama não precisa
 * conhecer os erros da biblioteca: expirado é `TOKEN_EXPIRED`; assinatura,
 * formato ou algoritmo inválido é `TOKEN_INVALID`.
 *
 * @returns {{ id: string }}
 * @throws {AppError} `TOKEN_EXPIRED` ou `TOKEN_INVALID`
 */
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] })
    return { id: payload.sub }
  } catch (error) {
    throw new AppError(error instanceof jwt.TokenExpiredError ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID')
  }
}
