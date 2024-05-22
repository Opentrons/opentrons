import { when } from 'vitest-when'
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { useRunActionMutations } from '@opentrons/react-api-client'

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
import { useNotifyRunQuery } from '../../../resources/runs'

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

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type * as ApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return {
    ...actual,
    useRunActionMutations: vi.fn(),
  }
})

vi.mock('../../ProtocolUpload/hooks')
vi.mock('../../../resources/runs')

describe('useRunControls hook', () => {
  it('returns run controls hooks', () => {
    const mockPlayRun = vi.fn()
    const mockPauseRun = vi.fn()
    const mockStopRun = vi.fn()
    const mockCloneRun = vi.fn()
    const mockResumeRunFromRecovery = vi.fn()

    when(useRunActionMutations).calledWith(mockPausedRun.id).thenReturn({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      resumeRunFromRecovery: mockResumeRunFromRecovery,
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
      isResumeRunFromRecoveryActionLoading: false,
    })
    when(useCloneRun)
      .calledWith(mockPausedRun.id, undefined, true)
      .thenReturn({ cloneRun: mockCloneRun, isLoading: false })

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
  it('returns the run status of the run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('running')
  })

  it('returns a "idle" run status if idle and run unstarted', () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockIdleUnstartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('idle')
  })

  it('returns a "running" run status if idle and run started', () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockIdleStartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunStatus(RUN_ID_2))
    expect(result.current).toBe('running')
  })
})

describe('useCurrentRunStatus hook', () => {
  beforeEach(() => {
    when(useCurrentRunId).calledWith().thenReturn(RUN_ID_2)
  })

  it('returns the run status of the current run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('running')
  })

  it('returns a "idle" run status if idle and run unstarted', () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockIdleUnstartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('idle')
  })

  it('returns a "running" run status if idle and run started', () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockIdleStartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('running')
  })
})

describe('useRunTimestamps hook', () => {
  beforeEach(() => {
    when(useRunCommands)
      .calledWith(RUN_ID_2, { cursor: null, pageLength: 1 }, expect.any(Object))
      .thenReturn([mockCommand.data as any])
  })

  it('returns the start time of the current run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.startedAt).toBe('2021-10-25T12:54:53.366581+00:00')
  })

  it('returns null when pause is not the last action', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.pausedAt).toBe(null)
  })

  it('returns the pause time of the current run when pause is the last action', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.pausedAt).toBe('2021-10-25T13:23:31.366581+00:00')
  })

  it('returns stopped time null when stop is not the last action', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.stoppedAt).toBe(null)
  })

  it('returns the stop time of the current run when stop is the last action', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockStoppedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.stoppedAt).toBe('2021-10-25T13:58:22.366581+00:00')
  })

  it('returns the complete time of a successful current run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockSucceededRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('noon thirty')
  })

  it('returns the complete time of a failed current run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockFailedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('noon forty-five')
  })

  it('returns the complete time of a stopped current run', async () => {
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: { data: mockStoppedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunTimestamps(RUN_ID_2))
    expect(result.current.completedAt).toBe('2021-10-25T13:58:22.366581+00:00')
  })
})

describe('useRunErrors hook', () => {
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
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
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
    when(useNotifyRunQuery)
      .calledWith(RUN_ID_2, expect.any(Object))
      .thenReturn(({
        data: {
          data: mockRunningRun,
          errors: undefined,
        },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(() => useRunErrors(RUN_ID_2))
    expect(result.current).toEqual([])
  })
})
