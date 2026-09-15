import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, POST, request } from '../request'

import type { AxiosRequestConfig } from 'axios'
import type { HostConfig } from '../types'

describe('request', () => {
  const requestor = vi.fn()

  const hostConfig: HostConfig = {
    hostname: '127.0.0.1',
    requestor,
  }

  beforeEach(() => {
    requestor.mockReset()
    requestor.mockResolvedValue({ data: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function lastBaseURL(): string {
    const config = requestor.mock.calls[0][0] as AxiosRequestConfig
    return config.baseURL as string
  }

  it('percent-encodes userNotes with newlines and Unicode for the header', async () => {
    const userNotes = 'line 1\nline 2\n🥟'

    await request(POST, '/runs', hostConfig, { userNotes })

    expect(requestor).toHaveBeenCalledTimes(1)
    const config = requestor.mock.calls[0][0] as AxiosRequestConfig
    expect(config.headers).toMatchObject({
      'Opentrons-User-Notes': encodeURI(userNotes),
    })
    expect(config.headers?.['Opentrons-User-Notes']).toStrictEqual(
      'line%201%0Aline%202%0A%F0%9F%A5%9F'
    )
  })

  it('omits Opentrons-User-Notes when userNotes is undefined', async () => {
    await request(POST, '/runs', hostConfig)

    expect(requestor).toHaveBeenCalledTimes(1)
    const config = requestor.mock.calls[0][0] as AxiosRequestConfig
    expect(config.headers).not.toHaveProperty('Opentrons-User-Notes')
  })

  it('uses HTTPS for a remote host when a token is present', async () => {
    await request(GET, '/runs', {
      hostname: '192.168.1.10',
      token: 'access-token',
      requestor,
    })

    expect(lastBaseURL()).toBe('https://192.168.1.10:32313')
  })

  it('uses HTTPS for a remote host when requiresSecureTransport is set', async () => {
    await request(
      GET,
      '/keys/external/ca/plaintextCerts',
      { hostname: '192.168.1.10', requestor },
      { requiresSecureTransport: true }
    )

    expect(lastBaseURL()).toBe('https://192.168.1.10:32313')
  })

  it('uses HTTPS for a remote host when secure is true', async () => {
    await request(GET, '/server/update', {
      hostname: '192.168.1.10',
      secure: true,
      requestor,
    })

    expect(lastBaseURL()).toBe('https://192.168.1.10:32313')
  })

  it('keeps USB on HTTP when a token is present', async () => {
    await request(GET, '/runs', {
      hostname: 'opentrons-usb',
      token: 'access-token',
      requestor,
    })

    expect(lastBaseURL()).toBe('http://opentrons-usb:31950')
  })

  it('keeps USB on HTTP when requiresSecureTransport is set', async () => {
    await request(
      GET,
      '/keys/external/ca/plaintextCerts',
      { hostname: 'opentrons-usb', requestor },
      { requiresSecureTransport: true }
    )

    expect(lastBaseURL()).toBe('http://opentrons-usb:31950')
  })

  it('keeps USB on HTTP when secure is true', async () => {
    await request(GET, '/server/update', {
      hostname: 'opentrons-usb',
      secure: true,
      requestor,
    })

    expect(lastBaseURL()).toBe('http://opentrons-usb:31950')
  })

  it('keeps loopback on HTTP when secure is true', async () => {
    await request(GET, '/server/update', {
      hostname: '127.0.0.1',
      secure: true,
      requestor,
    })

    expect(lastBaseURL()).toBe('http://127.0.0.1:31950')
  })
})
