import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getRuns } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllRunsQuery } from '..'
import { mockRunsResponse } from '../__fixtures__'

import type {
  GetRunsParams,
  HostConfig,
  Response,
  Runs,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useAllRunsQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & GetRunsParams
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & GetRunsParams
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(useAllRunsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRuns).mockRejectedValue('oh no')

    const { result } = renderHook(useAllRunsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current robot runs', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRuns).mockResolvedValue({
      data: mockRunsResponse,
    } as Response<Runs>)

    const { result } = renderHook(useAllRunsQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockRunsResponse)
    })
  })

  it('should return specified pageLength of runs', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getRuns).mockResolvedValue({
      data: mockRunsResponse,
    } as Response<Runs>)

    const { result } = renderHook(() => useAllRunsQuery({ pageLength: 20 }), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockRunsResponse)
    })
  })
})
