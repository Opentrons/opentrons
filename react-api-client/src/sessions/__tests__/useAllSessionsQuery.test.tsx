import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getSessions } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllSessionsQuery } from '..'

import type { UseQueryOptions } from 'react-query'
import type { HostConfig, Response, Sessions } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSIONS_RESPONSE = {
  data: [
    { sessionType: 'deckCalibration', id: '1' },
    { sessionType: 'tipLengthCalibration', id: '2' },
  ],
} as Sessions

describe('useAllSessionsQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseQueryOptions<Sessions, Error>
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseQueryOptions<Sessions, Error>
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(useAllSessionsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get sessions request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSessions).mockRejectedValue('oh no')

    const { result } = renderHook(useAllSessionsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current robot sessions', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSessions).mockResolvedValue({
      data: SESSIONS_RESPONSE,
    } as Response<Sessions>)

    const { result } = renderHook(useAllSessionsQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(SESSIONS_RESPONSE)
    })
  })
})
