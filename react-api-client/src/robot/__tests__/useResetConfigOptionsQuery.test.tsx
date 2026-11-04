import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getResetConfigOptions } from '@opentrons/api-client'

import { useResetConfigOptionsQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  ResetConfigOptionsResponse,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RESET_OPTIONS_RESPONSE: ResetConfigOptionsResponse = {
  options: [
    { id: 'foo', name: 'Foo', description: 'foobar' },
    { id: 'bar', name: 'Bar', description: 'barfoo' },
  ],
}

describe('useResetConfigOptionsQuery hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useResetConfigOptionsQuery(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return reset options response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getResetConfigOptions).mockResolvedValue({
      data: RESET_OPTIONS_RESPONSE,
    } as Response<ResetConfigOptionsResponse>)

    const { result } = renderHook(() => useResetConfigOptionsQuery(), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(RESET_OPTIONS_RESPONSE)
    })
  })
})
