import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { deleteProtocol } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDeleteProtocolMutation } from '..'
import type { HostConfig, Response, EmptyResponse } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const DELETE_PROTOCOL_RESPONSE = {
  data: null,
} as EmptyResponse

describe('useDeleteProtocolMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  const protocolId = '123'

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data when calling deleteProtocol if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(deleteProtocol).mockRejectedValue('oh no')

    const { result } = renderHook(() => useDeleteProtocolMutation(protocolId), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.deleteProtocol()
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should delete a protocol when calling the deleteProtocol callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(deleteProtocol).mockResolvedValue({
      data: DELETE_PROTOCOL_RESPONSE,
    } as Response<EmptyResponse>)

    const { result } = renderHook(() => useDeleteProtocolMutation(protocolId), {
      wrapper,
    })
    act(() => result.current.deleteProtocol())

    await waitFor(() => {
      expect(result.current.data).toEqual(DELETE_PROTOCOL_RESPONSE)
    })
  })
})
