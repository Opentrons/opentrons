import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getPipettes } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePipettesQuery } from '..'

import type {
  GetPipettesParams,
  HostConfig,
  Pipettes,
  Response,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetPipettes = getPipettes as jest.MockedFunction<typeof getPipettes>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PIPETTES_RESPONSE: Pipettes = {
  left: {
    model: 'p10_single_v1',
    name: 'p10_single',
    tip_length: 0.0,
    mount_axis: 'z',
    plunger_axis: 'b',
    id: '123',
  },
  right: {
    model: 'p300_single_v1',
    name: 'p300_single',
    tip_length: 0.0,
    mount_axis: 'a',
    plunger_axis: 'c',
    id: '321',
  },
} as any

describe('usePipettesQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & GetPipettesParams
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & GetPipettesParams
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(usePipettesQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getPipettes request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetPipettes)
      .calledWith(HOST_CONFIG, { refresh: false })
      .mockRejectedValue('oh no')

    const { result } = renderHook(usePipettesQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current attached pipettes', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetPipettes)
      .calledWith(HOST_CONFIG, { refresh: false })
      .mockResolvedValue({ data: PIPETTES_RESPONSE } as Response<Pipettes>)

    const { result } = renderHook(usePipettesQuery, {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(PIPETTES_RESPONSE)
    })
  })
})
