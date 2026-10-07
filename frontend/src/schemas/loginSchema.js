import { z } from 'zod'

/**
 * Mesma forma do schema de login da API: e-mail válido e senha presente. A
 * política de senha é do cadastro; no login, senha fora dela é credencial
 * inválida, e quem responde é a API.
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail em formato inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
