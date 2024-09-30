import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getProtocols } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllProtocolsQuery } from '..'

import type { HostConfig, Response, Protocols } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PROTOCOLS_RESPONSE = {
  data: [
    {
      id: '1',
      createdAt: 'now',
      protocolType: 'json',
      metadata: {},
      analysisSummaries: {},
    },
    {
      id: '2',
      createdAt: 'now',
      protocolType: 'python',
      metadata: {},
      analysisSummaries: {},
    },
  ],
} as Protocols

describe('useAllProtocolsQuery hook', () => {
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

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(useAllProtocolsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getProtocols request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getProtocols).mockRejectedValue('oh no')

    const { result } = renderHook(useAllProtocolsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current protocols', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getProtocols).mockResolvedValue({
      data: PROTOCOLS_RESPONSE,
    } as Response<Protocols>)

    const { result } = renderHook(useAllProtocolsQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(PROTOCOLS_RESPONSE)
    })
  })
})
