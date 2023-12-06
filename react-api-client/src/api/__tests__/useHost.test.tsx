// tests for the HostConfig context and hook
import * as React from 'react'
import { renderHook } from '@testing-library/react'

import { ApiHostProvider, useHost } from '..'

describe('ApiHostProvider and useHost', () => {
  it('should default to null if no host provided', () => {
    const { result } = renderHook(useHost)

    expect(result.current).toBe(null)
  })

  it('should allow a hostname to be unset', () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <ApiHostProvider hostname={null}>{children}</ApiHostProvider>
    )
    const { result } = renderHook(useHost, { wrapper })

    expect(result.current).toBe(null)
  })

  it('should allow a hostname to be set', () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <ApiHostProvider hostname="localhost">{children}</ApiHostProvider>
    )
    const { result } = renderHook(useHost, { wrapper })

    expect(result.current).toEqual({
      hostname: 'localhost',
      port: null,
      robotName: null,
    })
  })

  it('should allow a port to be set', () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <ApiHostProvider hostname="127.0.0.1" port={31950}>
        {children}
      </ApiHostProvider>
    )
    const { result } = renderHook(useHost, { wrapper })

    expect(result.current).toEqual({
      hostname: '127.0.0.1',
      port: 31950,
      robotName: null,
    })
  })

  it('should allow a robot name to be set', () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <ApiHostProvider hostname="127.0.0.1" robotName="otie">
        {children}
      </ApiHostProvider>
    )
    const { result } = renderHook(useHost, { wrapper })

    expect(result.current).toEqual({
      hostname: '127.0.0.1',
      port: null,
      robotName: 'otie',
    })
  })
})
