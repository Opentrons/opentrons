import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getNetworkingStatus } from '@opentrons/api-client'

import { useNetworkingStatusQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  NetworkingStatusResponse,
  Response,
} from '@opentrons/api-client'
import type { UseNetworkingStatusQueryOptions } from '../useNetworkingStatusQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const NETWORKING_STATUS_RESPONSE: NetworkingStatusResponse = {
  status: 'full',
  interfaces: {
    wlan0: {
      ipAddress: '192.168.1.42/24',
      macAddress: '00:00:00:00:00:00',
      gatewayAddress: '192.168.1.1',
      state: 'connected',
      type: 'wifi',
    },
  },
}

describe('useNetworkingStatusQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseNetworkingStatusQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseNetworkingStatusQueryOptions
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

    const { result } = renderHook(() => useNetworkingStatusQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if networking status request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getNetworkingStatus).mockRejectedValue('oh no')

    const { result } = renderHook(() => useNetworkingStatusQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return networking status response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getNetworkingStatus).mockResolvedValue({
      data: NETWORKING_STATUS_RESPONSE,
    } as Response<NetworkingStatusResponse>)

    const { result } = renderHook(() => useNetworkingStatusQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(NETWORKING_STATUS_RESPONSE)
    })
  })
})
