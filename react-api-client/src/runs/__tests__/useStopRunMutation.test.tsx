import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction, RUN_ACTION_TYPE_STOP } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useStopRunMutation } from '..'

import { RUN_ID_1, mockStopRunAction } from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateRunAction = createRunAction as jest.MockedFunction<
  typeof createRunAction
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useStopRunMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  const createStopRunActionData = { actionType: RUN_ACTION_TYPE_STOP }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling stopRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, RUN_ID_1, createStopRunActionData)
      .mockRejectedValue('oops')

    const { result } = renderHook(() => useStopRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.stopRun(RUN_ID_1)
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a stop run action when calling the stopRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, RUN_ID_1, createStopRunActionData)
      .mockResolvedValue({ data: mockStopRunAction } as Response<RunAction>)

    const { result } = renderHook(() => useStopRunMutation(), {
      wrapper,
    })
    act(() => result.current.stopRun(RUN_ID_1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStopRunAction)
    })
  })
})
