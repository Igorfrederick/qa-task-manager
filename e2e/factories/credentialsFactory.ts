import { faker } from '@faker-js/faker'

import type { Credentials } from '../services/AuthService'

/**
 * Credenciais que não entram: e-mail com entropia, que nenhum seed cria, e
 * senha gerada. Override fixa o que o teste precisa — por exemplo, o e-mail
 * de uma conta real, para provar a senha errada.
 */
export function buildCredentials(overrides: Partial<Credentials> = {}): Credentials {
  return {
    email: `${faker.internet.username()}.${faker.string.alphanumeric(8)}@exemplo.test`.toLowerCase(),
    password: faker.internet.password({ length: 16 }),
    ...overrides,
  }
}

/** Texto sem @: e-mail fora do formato, que a validação da tela recusa. */
export function buildMalformedEmail(): string {
  return faker.string.alpha({ length: 12 })
}
