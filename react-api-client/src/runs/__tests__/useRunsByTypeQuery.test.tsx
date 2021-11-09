import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import {
  getRuns,
  RUN_TYPE_BASIC,
  RUN_TYPE_PROTOCOL,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { useRunsByTypeQuery } from '..'

import type { HostConfig, Response, Runs } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetRuns = getRuns as jest.MockedFunction<typeof getRuns>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUNS_RESPONSE = {
  data: [
    { runType: RUN_TYPE_PROTOCOL, id: '1' },
    { runType: RUN_TYPE_BASIC, id: '2' },
  ],
} as Runs

describe('useRunsByTypeQuery hook', () => {
  let wrapper: React.FunctionComponent<{}>

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

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(
      () => useRunsByTypeQuery({ runType: RUN_TYPE_BASIC }),
      { wrapper }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetRuns).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useRunsByTypeQuery({ runType: RUN_TYPE_BASIC }),
      { wrapper }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return all runs of the given type', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetRuns)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: RUNS_RESPONSE } as Response<Runs>)

    const { result, waitFor } = renderHook(
      () => useRunsByTypeQuery({ runType: RUN_TYPE_BASIC }),
      { wrapper }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(
      RUNS_RESPONSE.data.filter(run => run.runType === RUN_TYPE_BASIC)
    )
  })
})
