/**
 * Único ponto que lê e escreve o token no navegador. Só o token fica
 * guardado: o usuário vem da API. A escolha do `localStorage` está em
 * docs/decisions.md (07/10/2026).
 */
const TOKEN_KEY = 'task-manager.token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}
