import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import { getProtocols } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllProtocolsQuery } from '..'

import type { HostConfig, Response, Protocols } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetProtocols = getProtocols as jest.MockedFunction<
  typeof getProtocols
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

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
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useAllProtocolsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getProtocols request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetProtocols).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useAllProtocolsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current protocols', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetProtocols)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: PROTOCOLS_RESPONSE } as Response<Protocols>)

    const { result, waitFor } = renderHook(useAllProtocolsQuery, { wrapper })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(PROTOCOLS_RESPONSE)
  })
})
