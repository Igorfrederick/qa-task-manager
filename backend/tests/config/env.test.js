import { describe, expect, it } from 'vitest'

import { env } from '../../src/config/env.js'

describe('config/env', () => {
  it('carrega as obrigatórias na suíte sem depender de .env no disco', () => {
    expect(env.mongodbUri).toBeTruthy()
    expect(env.jwtSecret).toBeTruthy()
  })

  it('converte para número os valores numéricos', () => {
    expect(typeof env.port).toBe('number')
    expect(typeof env.bcryptSaltRounds).toBe('number')
  })
})
