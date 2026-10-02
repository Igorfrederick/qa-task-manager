import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'

describe('GET /api/health', () => {
  it('responde 200 sem precisar de porta aberta nem de banco', async () => {
    const response = await request(createApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
