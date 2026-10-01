import { afterEach, describe, expect, it, vi } from 'vitest'

import { OPENTRONS_USB } from '/app/redux/discovery/constants'

import { isSSLError } from '../isSSLError'

function networkError(): unknown {
  return {
    isAxiosError: true,
    message: 'Network Error',
  }
}

describe('isSSLError', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('treats a Network Error on a LAN hostname as a missing cert', () => {
    expect(isSSLError(networkError(), '192.168.1.10')).toBe(true)
  })

  it('does not treat a Network Error on USB as a missing cert', () => {
    expect(isSSLError(networkError(), OPENTRONS_USB)).toBe(false)
  })

  it('does not treat a Network Error on localhost as a missing cert', () => {
    expect(isSSLError(networkError(), 'localhost')).toBe(false)
  })

  it('treats an explicit cert authority error on a LAN hostname as a missing cert', () => {
    expect(
      isSSLError(
        {
          isAxiosError: true,
          code: 'ERR_CERT_AUTHORITY_INVALID',
          message: 'certificate',
        },
        '192.168.1.10'
      )
    ).toBe(true)
  })
})
