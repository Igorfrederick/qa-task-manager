import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { AppError, ERRORS } from '../../src/utils/errors.js'

/**
 * Teste do catálogo de erros, sem HTTP e sem banco.
 *
 * É aqui que a mensagem é testada. Os testes de API e E2E asserem o `code`,
 * nunca a mensagem — decisão em `docs/decisions.md` —, e a cobertura da
 * mensagem fica no nível de unidade, sobre o catálogo.
 */
describe('catálogo de erros', () => {
  it('declara status de erro HTTP e mensagem para todo code', () => {
    for (const [code, { status, message }] of Object.entries(ERRORS)) {
      expect(code).toMatch(/^[A-Z]+(_[A-Z]+)*$/)
      expect(status, code).toBeGreaterThanOrEqual(400)
      expect(status, code).toBeLessThan(600)
      expect(message, code).toBeTruthy()
    }
  })

  it('não tem code fora do contrato da API, nem com status diferente do contrato', () => {
    // O contrato vem antes do código: `code` novo entra em api_contract.md
    // antes ou junto do código que o lança. Este teste impede o inverso — o
    // catálogo do backend divergir do contrato em silêncio.
    const contract = readFileSync(
      new URL('../../../.claude/knowledge/conventions/api_contract.md', import.meta.url),
      'utf8',
    )
    const section = contract.split('## Catálogo de `code`s')[1].split('\n## ')[0]
    const contractStatus = Object.fromEntries(
      [...section.matchAll(/^\| `([A-Z_]+)` \| `(\d{3})` \|/gm)].map(([, code, status]) => [
        code,
        Number(status),
      ]),
    )

    for (const [code, { status }] of Object.entries(ERRORS)) {
      expect(contractStatus[code], code).toBe(status)
    }
  })
})

describe('AppError', () => {
  it('toma status e mensagem do catálogo pelo code', () => {
    const error = new AppError('EMAIL_TAKEN')

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('EMAIL_TAKEN')
    expect(error.status).toBe(409)
    expect(error.message).toBe(ERRORS.EMAIL_TAKEN.message)
    expect(error.details).toEqual([])
  })

  it('carrega os details recebidos', () => {
    const details = [{ field: 'email', issue: 'E-mail em formato inválido' }]

    expect(new AppError('VALIDATION_ERROR', details).details).toEqual(details)
  })

  it('recusa code fora do catálogo, inclusive nome herdado de Object', () => {
    expect(() => new AppError('EMAL_TAKEN')).toThrow(/fora do catálogo/)
    expect(() => new AppError('toString')).toThrow(/fora do catálogo/)
  })
})
