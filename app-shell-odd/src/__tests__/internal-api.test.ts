import { env } from 'node:process'
import { describe, expect, it, vi } from 'vitest'

import { mapRequestToInternalConfig } from '../internal-api'

vi.mock('../log', () => {
  return {
    createLogger: () => {
      return {
        debug: vi.fn(),
        silly: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }
    },
  }
})

describe('internal-api', () => {
  it('maps UDS paths', () => {
    const url = '/keys/internal/ca/password'
    const socketPath = '/run/opentrons-key-server.sock'
    expect(mapRequestToInternalConfig({ url, method: 'GET' })).toEqual({
      socketPath,
      method: 'GET',
      url,
    })
  })
  it('maps localhost paths', () => {
    env.ODD_key_server_host = 'http://127.0.0.1:3232'
    const url = '/keys/internal/ca/password'
    expect(mapRequestToInternalConfig({ url, method: 'GET' })).toEqual({
      baseURL: 'http://127.0.0.1:3232',
      port: '3232',
      url,
      method: 'GET',
    })
  })
})
