import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getProtocol } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useProtocolQuery } from '..'

import type { HostConfig, Response, Protocol } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PROTOCOL_ID = '1'
const PROTOCOL_RESPONSE = {
  data: {
    protocolType: 'json',
    protocolKind: 'standard',
    createdAt: 'now',
    id: '1',
    metadata: {},
    analysisSummaries: [],
    files: [],
    robotType: 'OT-3 Standard',
  },
} as Protocol

describe('useProtocolQuery hook', () => {
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

    const { result } = renderHook(() => useProtocolQuery(PROTOCOL_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get protocols request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getProtocol).mockRejectedValue('oh no')

    const { result } = renderHook(() => useProtocolQuery(PROTOCOL_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a protocol', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getProtocol).mockResolvedValue({
      data: PROTOCOL_RESPONSE,
    } as Response<Protocol>)

    const { result } = renderHook(() => useProtocolQuery(PROTOCOL_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(PROTOCOL_RESPONSE)
    })
  })
})
