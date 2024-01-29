import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAllCommandsQuery, DEFAULT_PARAMS } from '../useAllCommandsQuery'
import { mockCommandsResponse } from '../__fixtures__'

import type { HostConfig, Response, CommandsData } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetCommands = getCommands as jest.MockedFunction<typeof getCommands>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = 'run_id'

describe('useAllCommandsQuery hook', () => {
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
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get commands request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCommands)
      .calledWith(HOST_CONFIG, RUN_ID, DEFAULT_PARAMS)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all commands for a given run', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCommands)
      .calledWith(HOST_CONFIG, RUN_ID, DEFAULT_PARAMS)
      .mockResolvedValue({
        data: mockCommandsResponse,
      } as Response<CommandsData>)

    const { result } = renderHook(() => useAllCommandsQuery(RUN_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCommandsResponse)
    })
  })
})
