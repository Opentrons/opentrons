import * as React from 'react'
import { when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import { getEstopState } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useEstopQuery } from '..'

import type { HostConfig, Response, EstopState } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetEstopState = getEstopState as jest.MockedFunction<
  typeof getEstopState
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const ESTOP_STATE_RESPONSE: EstopState = {
  status: 'disengaged',
  estopPhysicalStatus: { status: 'disengaged' },
} as EstopState

describe('useEstopQuery hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return no data if no host', () => {
    when(useHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useEstopQuery, { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if estop request fails', () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetEstopState).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useEstopQuery, { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return estop state response data', async () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetEstopState)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: ESTOP_STATE_RESPONSE } as Response<EstopState>)

    const { result, waitFor } = renderHook(useEstopQuery, { wrapper })

    await waitFor(() => result.current?.data != null)

    expect(result.current?.data).toEqual(ESTOP_STATE_RESPONSE)
  })
})
