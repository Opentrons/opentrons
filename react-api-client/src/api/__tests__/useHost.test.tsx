// tests for the HostConfig context and hook
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ApiHostContext, useHost } from '..'

import type * as React from 'react'
import type { HostConfig } from '@opentrons/api-client'

function createWrapper(
  hostConfig: HostConfig | null
): React.FunctionComponent<{ children: React.ReactNode }> {
  return ({ children }) => (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}

describe('useHost', () => {
  it('should default to null if no host provided', () => {
    const { result } = renderHook(useHost)

    expect(result.current).toBe(null)
  })

  it('should allow a hostname to be unset', () => {
    const { result } = renderHook(useHost, {
      wrapper: createWrapper(null),
    })

    expect(result.current).toBe(null)
  })

  it('should allow a hostname to be set', () => {
    const { result } = renderHook(useHost, {
      wrapper: createWrapper({
        hostname: 'localhost',
        port: null,
        robotName: null,
      }),
    })

    expect(result.current).toEqual({
      hostname: 'localhost',
      port: null,
      robotName: null,
    })
  })

  it('should allow a port to be set', () => {
    const { result } = renderHook(useHost, {
      wrapper: createWrapper({
        hostname: '127.0.0.1',
        port: 31950,
        robotName: null,
      }),
    })

    expect(result.current).toEqual({
      hostname: '127.0.0.1',
      port: 31950,
      robotName: null,
    })
  })

  it('should allow a robot name to be set', () => {
    const { result } = renderHook(useHost, {
      wrapper: createWrapper({
        hostname: '127.0.0.1',
        port: null,
        robotName: 'otie',
      }),
    })

    expect(result.current).toEqual({
      hostname: '127.0.0.1',
      port: null,
      robotName: 'otie',
    })
  })
})
