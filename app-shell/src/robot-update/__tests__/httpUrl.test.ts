import { afterEach, describe, expect, it, vi } from 'vitest'

import { OPENTRONS_USB } from '../../constants'
import { buildRobotHttpUrl } from '../httpUrl'

describe('buildRobotHttpUrl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('uses HTTPS for a remote host when a token is present', () => {
    expect(
      buildRobotHttpUrl({ ip: '192.168.1.10' }, '/server/update', {
        token: 'access-token',
      })
    ).toBe('https://192.168.1.10:32313/server/update')
  })

  it('uses HTTPS for a remote host when secure is true', () => {
    expect(
      buildRobotHttpUrl({ ip: '192.168.1.10' }, '/server/update', {
        secure: true,
      })
    ).toBe('https://192.168.1.10:32313/server/update')
  })

  it('keeps USB on HTTP when a token is present', () => {
    expect(
      buildRobotHttpUrl({ ip: OPENTRONS_USB }, '/server/update', {
        token: 'access-token',
      })
    ).toBe('http://opentrons-usb:31950/server/update')
  })

  it('keeps USB on HTTP when secure is true', () => {
    expect(
      buildRobotHttpUrl({ ip: OPENTRONS_USB }, '/server/update', {
        secure: true,
      })
    ).toBe('http://opentrons-usb:31950/server/update')
  })

  it('keeps loopback on HTTP when secure is true', () => {
    expect(
      buildRobotHttpUrl({ ip: '127.0.0.1' }, '/server/update', {
        secure: true,
      })
    ).toBe('http://127.0.0.1:31950/server/update')
  })
})
