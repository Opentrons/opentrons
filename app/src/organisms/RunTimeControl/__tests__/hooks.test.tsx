import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { act, renderHook } from '@testing-library/react'
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import {
  useCloneRun,
  useCurrentRunId,
  useRunCommands,
} from '../../ProtocolUpload/hooks'

import {
  useRunControls,
  useRunStatus,
  useCurrentRunStatus,
  useRunTimestamps,
  useRunErrors,
} from '../hooks'

import {
  RUN_ID_2,
  mockPausedRun,
  mockRunningRun,
  mockFailedRun,
  mockStoppedRun,
  mockSucceededRun,
  mockIdleUnstartedRun,
  mockIdleStartedRun,
  mockCommand,
} from '../__fixtures__'

import type { Run } from '@opentrons/api-client'
jest.mock('@opentrons/react-api-client')
jest.mock('../../ProtocolUpload/hooks')

const mockUseCloneRun = useCloneRun as jest.MockedFunction<typeof useCloneRun>
const mockUseRunCommands = useRunCommands as jest.MockedFunction<
  typeof useRunCommands
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunActionMutations = useRunActionMutations as jest.MockedFunction<
  typeof useRunActionMutations
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

describe('useRunControls hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('returns run controls hooks', () => {
    const mockPlayRun = jest.fn()
    const mockPauseRun = jest.fn()
    const mockStopRun = jest.fn()
    const mockCloneRun = jest.fn()

    when(mockUseRunActionMutations)
      .calledWith(mockPausedRun.id)
      .mockReturnValue({
        playRun: mockPlayRun,
        pauseRun: mockPauseRun,
        stopRun: mockStopRun,
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
      })
    when(mockUseCloneRun)
      .calledWith(mockPausedRun.id, undefined)
      .mockReturnValue({ cloneRun: mockCloneRun, isLoading: false })

    const { result } = renderHook(() => useRunControls(mockPausedRun.id))

    act(() => result.current.play())
    expect(mockPlayRun).toHaveBeenCalledTimes(1)
    act(() => result.current.pause())
    expect(mockPauseRun).toHaveBeenCalledTimes(1)
    act(() => result.current.stop())
    expect(mockStopRun).toHaveBeenCalledTimes(1)
    act(() => result.current.reset())
    expect(mockCloneRun).toHaveBeenCalledTimes(1)
  })
})

describe('useRunStatus hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the run status of the run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('running')
  })

  it('returns a "idle" run status if idle and run unstarted', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockIdleUnstartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('idle')
  })

  it('returns a "running" run status if idle and run started', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockIdleStartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('running')
  })
})

describe('useCurrentRunStatus hook', () => {
  beforeEach(() => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID_2)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the run status of the current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('running')
  })

  it('returns a "idle" run status if idle and run unstarted', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockIdleUnstartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('idle')
  })

  it('returns a "running" run status if idle and run started', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockIdleStartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('running')
  })
})

describe('useRunTimestamps hook', () => {
  beforeEach(() => {
    when(mockUseRunCommands)
      .calledWith(RUN_ID_2, { cursor: null, pageLength: 1 }, expect.any(Object))
      .mockReturnValue([mockCommand.data as any])
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the start time of the current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.startedAt).toBe('2021-10-25T12:54:53.366581+00:00')
  })

  it('returns null when pause is not the last action', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.pausedAt).toBe(null)
  })

  it('returns the pause time of the current run when pause is the last action', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.pausedAt).toBe('2021-10-25T13:23:31.366581+00:00')
  })

  it('returns stopped time null when stop is not the last action', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.stoppedAt).toBe(null)
  })

  it('returns the stop time of the current run when stop is the last action', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockStoppedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.stoppedAt).toBe('2021-10-25T13:58:22.366581+00:00')
  })

  it('returns the complete time of a successful current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockSucceededRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('noon thirty')
  })

  it('returns the complete time of a failed current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockFailedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('noon forty-five')
  })

  it('returns the complete time of a stopped current run', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: { data: mockStoppedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('2021-10-25T13:58:22.366581+00:00')
  })
})

describe('useRunErrors hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns errors if present', async () => {
    const fixtureErrors = [
      {
        id: 'b5efe073-09a0-4874-8872-c42554bf15b5',
        errorType: 'LegacyContextCommandError',
        createdAt: '2022-02-11T14:58:20.676355+00:00',
        detail:
          "/dev/ot_module_thermocycler0: 'Received error response 'Error:Plate temperature is not uniform. T1: 35.1097\tT2: 35.8139\tT3: 35.6139\tT4: 35.9809\tT5: 35.4347\tT6: 35.5264\tT.Lid: 20.2052\tT.sink: 19.8993\tT_error: 0.0000\t\r\nLid:open'",
      },
      {
        id: 'ac02fd2a-9bd0-47e3-b739-ae562321e71d',
        errorType: 'ExceptionInProtocolError',
        createdAt: '2022-02-11T14:58:20.688699+00:00',
        detail:
          "ErrorResponse [line 40]: /dev/ot_module_thermocycler0: 'Received error response 'Error:Plate temperature is not uniform. T1: 35.1097\tT2: 35.8139\tT3: 35.6139\tT4: 35.9809\tT5: 35.4347\tT6: 35.5264\tT.Lid: 20.2052\tT.sink: 19.8993\tT_error: 0.0000\t\r\nLid:open'",
      },
    ]
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: {
          data: {
            ...mockRunningRun,
            errors: fixtureErrors,
          },
        },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunErrors(RUN_ID_2))
    expect(result.current).toBe(fixtureErrors)
  })

  it('returns no errors if no errors present', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .mockReturnValue(({
        data: {
          data: mockRunningRun,
          errors: undefined,
        },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunErrors(RUN_ID_2))
    expect(result.current).toEqual([])
  })
})
