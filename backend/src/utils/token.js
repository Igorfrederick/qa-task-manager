import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'

/**
 * Geração do JWT.
 *
 * Segredo, expiração e algoritmo vêm de um lugar só, porque a geração (login)
 * e a validação (middleware de autenticação) precisam concordar nos três. O
 * algoritmo é explícito para que a regra não dependa do padrão da biblioteca.
 *
 * O payload carrega o mínimo para autorizar: o id do usuário em `sub` — a
 * claim padrão de sujeito — e o perfil.
 */
const ALGORITHM = 'HS256'

/** @param {{ id: string, role: string }} user */
export function signToken({ id, role }) {
  return jwt.sign({ role }, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtExpiresIn,
    subject: String(id),
  })
}
