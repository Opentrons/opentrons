import { describe, expect, it } from 'vitest'

import { getQueryKey } from '..'

import type { HostConfig } from '@opentrons/api-client'

describe('getQueryKey', () => {
  it('returns an empty host key when hostConfig is null', () => {
    expect(getQueryKey(null, 'runs')).toStrictEqual([{}, 'runs'])
  })

  it('uses only hostname and port from hostConfig', () => {
    const hostConfig: HostConfig = {
      hostname: 'otie.local',
      port: 31950,
      robotName: 'otie',
      token: 'abc123',
      secure: true,
    }

    expect(getQueryKey(hostConfig, 'runs', 'details')).toStrictEqual([
      {
        hostname: 'otie.local',
        port: 31950,
      },
      'runs',
      'details',
    ])
  })

  it('normalizes undefined properties of hostConfig to null', () => {
    const hostConfig: HostConfig = {
      hostname: 'otie.local',
      port: undefined,
    }

    expect(getQueryKey(hostConfig, 'runs')).toStrictEqual([
      {
        hostname: 'otie.local',
        port: null,
      },
      'runs',
    ])
  })
})
