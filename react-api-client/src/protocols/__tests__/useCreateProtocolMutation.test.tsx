import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateProtocolMutation } from '..'
import type { HostConfig, Response, Protocol } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const contents = JSON.stringify({
  metadata: {
    protocolName: 'Multi select banner test protocol',
    author: '',
    description: '',
    created: 1606853851893,
    lastModified: 1621690582736,
    category: null,
    subcategory: null,
    tags: [],
  },
})
const jsonFile = new File([contents], 'valid.json')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PROTOCOL_RESPONSE = {
  data: {
    id: '1',
    createdAt: 'now',
    robotType: 'OT-3 Standard',
    protocolType: 'json',
    protocolKind: 'standard',
    metadata: {},
    analysisSummaries: [],
    files: [],
  },
} as Protocol

describe('useCreateProtocolMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  const createProtocolData = [jsonFile]

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data when calling createProtocol if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createProtocol).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.createProtocol({ files: createProtocolData })
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a protocol when calling the createProtocol callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createProtocol).mockResolvedValue({
      data: PROTOCOL_RESPONSE,
    } as Response<Protocol>)

    const { result } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })
    act(() => result.current.createProtocol({ files: createProtocolData }))

    await waitFor(() => {
      expect(result.current.data).toEqual(PROTOCOL_RESPONSE)
    })
  })

  it('should create a protocol with a protocolKey if included', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createProtocol).mockResolvedValue({
      data: PROTOCOL_RESPONSE,
    } as Response<Protocol>)

    const { result } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })
    act(() =>
      result.current.createProtocol({
        files: createProtocolData,
        protocolKey: 'fakeProtocolKey',
        runTimeParameterValues: { fakeParamName: 5.0 },
      })
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(PROTOCOL_RESPONSE)
    })
  })
})
