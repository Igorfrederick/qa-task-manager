import { z } from 'zod'

import { ROLE_VALUES } from '../utils/roles.js'

/**
 * O bcrypt considera só os primeiros 72 bytes da senha: o que passar disso é
 * ignorado em silêncio, e duas senhas que só diferem depois do limite valem a
 * mesma. O limite é em bytes, e não em caracteres — em UTF-8, cada letra
 * acentuada ocupa dois.
 */
const BCRYPT_MAX_BYTES = 72

/**
 * Schemas de entrada das rotas de autenticação.
 *
 * Só invariante de entrada — o que se julga olhando apenas o payload. Falha
 * aqui é `400` com `details`. Unicidade de e-mail depende do estado do banco,
 * é invariante de domínio e vive no service, com `409`.
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Informe o nome' })
    .trim()
    .min(2, 'O nome precisa de ao menos 2 caracteres')
    .max(120, 'O nome pode ter no máximo 120 caracteres'),
  email: z
    .string({ required_error: 'Informe o e-mail' })
    .trim()
    .toLowerCase()
    .email('E-mail em formato inválido'),
  password: z
    .string({ required_error: 'Informe a senha' })
    .min(8, 'A senha precisa de ao menos 8 caracteres')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_BYTES,
      `A senha pode ter no máximo ${BCRYPT_MAX_BYTES} bytes — letras acentuadas contam dois`,
    ),
  role: z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'Perfil inválido' }) }).optional(),
})

/**
 * Login: só a forma — e-mail válido e senha presente. A política de senha
 * (tamanho mínimo e máximo) é do cadastro; o login apenas confere a
 * credencial, e senha fora da política é credencial inválida, não payload
 * inválido.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Informe o e-mail' })
    .trim()
    .toLowerCase()
    .email('E-mail em formato inválido'),
  password: z.string({ required_error: 'Informe a senha' }).min(1, 'Informe a senha'),
})
