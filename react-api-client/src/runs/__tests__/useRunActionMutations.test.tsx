import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import {
  createRunAction,
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_STOP,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import {
  useRunActionMutations,
  UsePlayRunMutationResult,
  UsePauseRunMutationResult,
  UseCancelRunMutationResult,
} from '..'

import {
  mockPlayRunAction,
  mockPauseRunAction,
  mockStopRunAction,
} from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateRunAction = createRunAction as jest.MockedFunction<
  typeof createRunAction
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useRunActionMutations hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let usePlayRunMutation: () => UsePlayRunMutationResult
  let usePauseRunMutation: () => UsePauseRunMutationResult
  let useCancelRunMutation: () => UseCancelRunMutationResult
  const createPlayRunActionData = { actionType: RUN_ACTION_TYPE_PLAY }
  const createPauseRunActionData = { actionType: RUN_ACTION_TYPE_PAUSE }
  const createStopRunActionData = { actionType: RUN_ACTION_TYPE_STOP }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider

    const { result } = renderHook(() => useRunActionMutations())
    usePlayRunMutation = result.current.usePlayRunMutation
    usePauseRunMutation = result.current.usePauseRunMutation
    useCancelRunMutation = result.current.useCancelRunMutation
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling playRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createPlayRunActionData)
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(() => usePlayRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.playRun()
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return no data when calling pauseRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createPauseRunActionData)
      .mockRejectedValue('uh oh')

    const { result, waitFor } = renderHook(() => usePauseRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.pauseRun()
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return no data when calling cancelRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createStopRunActionData)
      .mockRejectedValue('oops')

    const { result, waitFor } = renderHook(() => useCancelRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.cancelRun()
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should create a play run action when calling the playRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createPlayRunActionData)
      .mockResolvedValue({ data: mockPlayRunAction } as Response<RunAction>)

    const { result, waitFor } = renderHook(() => usePlayRunMutation(), {
      wrapper,
    })
    act(() => result.current.playRun())

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockPlayRunAction)
  })

  it('should create a pause run action when calling the pauseRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createPauseRunActionData)
      .mockResolvedValue({ data: mockPauseRunAction } as Response<RunAction>)

    const { result, waitFor } = renderHook(() => usePauseRunMutation(), {
      wrapper,
    })
    act(() => result.current.pauseRun())

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockPauseRunAction)
  })

  it('should create a stop run action when calling the cancelRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, createStopRunActionData)
      .mockResolvedValue({ data: mockStopRunAction } as Response<RunAction>)

    const { result, waitFor } = renderHook(() => useCancelRunMutation(), {
      wrapper,
    })
    act(() => result.current.cancelRun())

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockStopRunAction)
  })
})
