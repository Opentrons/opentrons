import type * as React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getEstopStatus } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useEstopQuery } from '..'

import type { HostConfig, Response, EstopStatus } from '@opentrons/api-client'
import type { UseEstopQueryOptions } from '../useEstopQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ESTOP_STATE_RESPONSE: EstopStatus = {
  data: {
    status: 'disengaged',
    leftEstopPhysicalStatus: 'disengaged',
    rightEstopPhysicalStatus: 'disengaged',
  },
}

describe('useEstopQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseEstopQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseEstopQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if estop request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getEstopStatus).mockRejectedValue('oh no')

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return estop state response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getEstopStatus).mockResolvedValue({
      data: ESTOP_STATE_RESPONSE,
    } as Response<EstopStatus>)

    const { result } = renderHook(() => useEstopQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(ESTOP_STATE_RESPONSE)
    })
  })
})
