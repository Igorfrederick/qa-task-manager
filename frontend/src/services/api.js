import { tokenStorage } from '../utils/tokenStorage.js'

/**
 * Erro de uma chamada à API, na forma do contrato: o `code` é o que a lógica
 * consome; o `message`, o que a tela mostra.
 */
export class ApiError extends Error {
  constructor(status, { code, message, details = [] }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Falhas sem resposta da API no formato do contrato. Os codes nascem aqui, no
// cliente, e por isso não estão no catálogo da API.
const NETWORK_ERROR = {
  code: 'NETWORK_ERROR',
  message: 'Não foi possível falar com o servidor. Tente novamente.',
}
const UNEXPECTED_RESPONSE = {
  code: 'UNEXPECTED_RESPONSE',
  message: 'O servidor respondeu de forma inesperada. Tente novamente.',
}

// Quem encerra a sessão quando a API recusa o token. O AuthProvider registra;
// o cliente HTTP não conhece React.
let handleUnauthorized = () => {}

export function setUnauthorizedHandler(handler) {
  handleUnauthorized = handler
}

/**
 * Única porta de saída para a API. O caminho é relativo: em desenvolvimento,
 * o proxy do Vite repassa /api ao backend.
 */
export async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, NETWORK_ERROR)
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)
  if (response.ok && data !== null) return data

  // 401 encerra a sessão, com duas exceções. No login, é credencial inválida,
  // e quem trata é a tela. Com um token já trocado, é resposta atrasada, e não
  // pode derrubar a sessão nova. Chamada sem token entra na regra: é o caso de
  // outra aba que já saiu e apagou o token.
  if (response.status === 401 && path !== '/auth/login' && token === tokenStorage.get()) {
    handleUnauthorized()
  }

  throw new ApiError(response.status, data?.error ?? UNEXPECTED_RESPONSE)
}
