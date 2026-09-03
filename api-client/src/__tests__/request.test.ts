import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST, request } from '../request'

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
})
