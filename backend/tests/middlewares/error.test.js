import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { errorHandler } from '../../src/middlewares/error.js'

/**
 * Os três ramos do middleware de erro, pela resposta HTTP e sem banco.
 *
 * O erro não previsto precisa de uma rota que lance, e a API não tem uma — por
 * isso um app mínimo montado só com o handler, em vez de rota de teste dentro
 * do código de produção.
 */
describe('middleware de erro', () => {
  it('responde 404 NOT_FOUND no formato único para rota inexistente', async () => {
    const response = await request(createApp()).get('/api/rota-que-nao-existe')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String), details: [] },
    })
  })

  it('responde 400 VALIDATION_ERROR para JSON malformado', async () => {
    const response = await request(createApp())
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name":')

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details).toEqual([])
  })

  it('responde 500 INTERNAL_ERROR sem vazar a mensagem do erro original', async () => {
    const app = express()
    app.get('/falha', () => {
      throw new Error('detalhe interno: coleção users em /srv/app/src')
    })
    app.use(errorHandler)

    const response = await request(app).get('/falha')

    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe('INTERNAL_ERROR')
    expect(response.text).not.toContain('detalhe interno')
  })
})
