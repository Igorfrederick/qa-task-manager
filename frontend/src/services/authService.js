import { request } from './api.js'

/** Responde `{ token, user }`; credencial inválida é `ApiError` com `INVALID_CREDENTIALS`. */
export function login(credentials) {
  return request('/auth/login', { method: 'POST', body: credentials })
}
