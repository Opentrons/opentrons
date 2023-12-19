import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { deleteProtocol } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDeleteProtocolMutation } from '..'
import type { HostConfig, Response, EmptyResponse } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockDeleteProtocol = deleteProtocol as jest.MockedFunction<
  typeof deleteProtocol
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

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
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling deleteProtocol if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteProtocol)
      .calledWith(HOST_CONFIG, protocolId)
      .mockRejectedValue('oh no')

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
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteProtocol)
      .calledWith(HOST_CONFIG, protocolId)
      .mockResolvedValue({
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
