import type { APIRequestContext } from '@playwright/test'

export type Role = 'qa' | 'lead'

export type Credentials = {
  email: string
  password: string
}

export type User = {
  _id: string
  name: string
  email: string
  role: Role
}

export type Session = {
  token: string
  user: User
}

/**
 * Autenticação pela API. Serve ao setup e à conferência do teste — a jornada
 * de login que o teste prova passa pela tela, não por aqui.
 */
export class AuthService {
  private readonly request: APIRequestContext

  constructor(request: APIRequestContext) {
    this.request = request
  }

  async login(credentials: Credentials): Promise<Session> {
    const response = await this.request.post('auth/login', { data: credentials })
    if (!response.ok()) {
      throw new Error(`Login de ${credentials.email} respondeu ${response.status()}: ${await response.text()}`)
    }
    return response.json()
  }
}
