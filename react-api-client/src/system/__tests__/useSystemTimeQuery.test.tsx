import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSystemTime } from '@opentrons/api-client'

import { useSystemTimeQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  SystemTimeResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SYSTEM_TIME_RESPONSE: SystemTimeResponse = {
  data: {
    id: 'time',
    systemTime: '2020-09-08T18:02:01.318292+00:00',
  },
}

describe('useSystemTimeQuery hook', () => {
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

    const { result } = renderHook(() => useSystemTimeQuery(), { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return system time response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSystemTime).mockResolvedValue({
      data: SYSTEM_TIME_RESPONSE,
    } as Response<SystemTimeResponse>)

    const { result } = renderHook(() => useSystemTimeQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(SYSTEM_TIME_RESPONSE)
    })
  })
})
