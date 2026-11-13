import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addRequestErrorListener, GET, POST, request } from '../request'

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
    return config.baseURL!
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

  it('serializes URLSearchParams bodies as form-urlencoded strings', async () => {
    const body = new URLSearchParams({
      grant_type: 'password',
      username: 'admin',
      password: 'secret',
      client_id: 'opentrons_app',
    })

    await request(POST, '/auth/oauth2/token', hostConfig, { body })

    expect(requestor).toHaveBeenCalledTimes(1)
    const config = requestor.mock.calls[0][0] as AxiosRequestConfig
    expect(config.data).toBe(body.toString())
    expect(config.headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    })
  })

  it('notifies error listeners and still rejects when a request fails', async () => {
    const error = new Error('oh no')
    requestor.mockRejectedValue(error)
    const listener = vi.fn()
    const removeListener = addRequestErrorListener(listener)

    await expect(request(POST, '/runs', hostConfig)).rejects.toBe(error)
    expect(listener).toHaveBeenCalledWith(error, POST, hostConfig)

    removeListener()
  })

  it('does not notify error listeners when a request succeeds', async () => {
    const listener = vi.fn()
    const removeListener = addRequestErrorListener(listener)

    await request(GET, '/runs', hostConfig)
    expect(listener).not.toHaveBeenCalled()

    removeListener()
  })

  it('stops notifying a listener after it is removed', async () => {
    requestor.mockRejectedValue(new Error('oh no'))
    const listener = vi.fn()
    const removeListener = addRequestErrorListener(listener)
    removeListener()

    await expect(request(POST, '/runs', hostConfig)).rejects.toThrow()
    expect(listener).not.toHaveBeenCalled()
  })
})
