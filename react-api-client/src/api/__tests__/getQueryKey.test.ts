import { describe, expect, it } from 'vitest'

import { getQueryKey } from '..'

import type { HostConfig } from '@opentrons/api-client'

describe('getQueryKey', () => {
  it('returns an empty host key when hostConfig is null', () => {
    expect(getQueryKey(null, 'runs')).toStrictEqual([{}, 'runs'])
  })

  it('excludes robotName and token from hostConfig', () => {
    const hostConfig: HostConfig = {
      hostname: 'otie.local',
      port: 31950,
      robotName: 'otie',
      token: 'abc123',
      requestor: undefined,
      secure: true,
    }

    expect(getQueryKey(hostConfig, 'runs', 'details')).toStrictEqual([
      {
        hostname: 'otie.local',
        port: 31950,
        requestor: null,
        secure: true,
      },
      'runs',
      'details',
    ])
  })

  it('normalizes undefined and omitted properties of hostConfig to null', () => {
    const hostConfig: HostConfig = {
      hostname: 'otie.local',
      port: undefined,
    }

    expect(getQueryKey(hostConfig, 'runs')).toStrictEqual([
      {
        hostname: 'otie.local',
        port: null,
        requestor: null,
        secure: null,
      },
      'runs',
    ])
  })
})
