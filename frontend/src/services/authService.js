import { request } from './api.js'

/** Responde `{ token, user }`; credencial inválida é `ApiError` com `INVALID_CREDENTIALS`. */
export function login(credentials) {
  return request('/auth/login', { method: 'POST', body: credentials })
}

/** Usuário dono do token guardado. */
export async function getMe() {
  const { user } = await request('/auth/me')
  return user
}
