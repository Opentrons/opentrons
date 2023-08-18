import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateProtocolMutation } from '..'
import type { HostConfig, Response, Protocol } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

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

const mockCreateProtocol = createProtocol as jest.MockedFunction<
  typeof createProtocol
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PROTOCOL_RESPONSE = {
  data: {
    id: '1',
    createdAt: 'now',
    robotType: 'OT-3 Standard',
    protocolType: 'json',
    metadata: {},
    analysisSummaries: [],
    files: [],
  },
} as Protocol

describe('useCreateProtocolMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  const createProtocolData = [jsonFile]

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling createProtocol if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateProtocol)
      .calledWith(HOST_CONFIG, createProtocolData)
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.createProtocol({ files: createProtocolData })
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should create a protocol when calling the createProtocol callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateProtocol)
      .calledWith(HOST_CONFIG, createProtocolData, undefined)
      .mockResolvedValue({ data: PROTOCOL_RESPONSE } as Response<Protocol>)

    const { result, waitFor } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })
    act(() => result.current.createProtocol({ files: createProtocolData }))

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(PROTOCOL_RESPONSE)
  })

  it('should create a protocol with a protocolKey if included', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateProtocol)
      .calledWith(HOST_CONFIG, createProtocolData, 'fakeProtocolKey')
      .mockResolvedValue({ data: PROTOCOL_RESPONSE } as Response<Protocol>)

    const { result, waitFor } = renderHook(() => useCreateProtocolMutation(), {
      wrapper,
    })
    act(() =>
      result.current.createProtocol({
        files: createProtocolData,
        protocolKey: 'fakeProtocolKey',
      })
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(PROTOCOL_RESPONSE)
  })
})
