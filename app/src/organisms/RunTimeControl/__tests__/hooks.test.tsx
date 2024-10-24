import { when } from 'vitest-when'
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { useRunActionMutations } from '@opentrons/react-api-client'

import { useRunControls, useCurrentRunStatus, useRunErrors } from '../hooks'
import {
  useNotifyRunQuery,
  useCurrentRunId,
  useRunStatus,
  useCloneRun,
} from '/app/resources/runs'

import {
  RUN_ID_2,
  mockPausedRun,
  mockRunningRun,
} from '/app/resources/runs/__fixtures__'

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

vi.mock('/app/resources/protocols')
vi.mock('/app/resources/runs')

describe('useRunControls hook', () => {
  it('returns run controls hooks', () => {
    const mockPlayRun = vi.fn()
    const mockPauseRun = vi.fn()
    const mockStopRun = vi.fn()
    const mockCloneRun = vi.fn()
    const mockResumeRunFromRecovery = vi.fn()
    const mockResumeRunFromRecoveryAssumingFalsePositive = vi.fn()

    when(useRunActionMutations).calledWith(mockPausedRun.id).thenReturn({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      resumeRunFromRecovery: mockResumeRunFromRecovery,
      resumeRunFromRecoveryAssumingFalsePositive: mockResumeRunFromRecoveryAssumingFalsePositive,
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
      isResumeRunFromRecoveryActionLoading: false,
      isResumeRunFromRecoveryAssumingFalsePositiveActionLoading: false,
    })
    when(useCloneRun).calledWith(mockPausedRun.id, undefined, true).thenReturn({
      cloneRun: mockCloneRun,
      isCloning: false,
      isLoadingRun: false,
    })

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

describe('useCurrentRunStatus hook', () => {
  beforeEach(() => {
    when(useCurrentRunId).calledWith().thenReturn(RUN_ID_2)
  })

  it('returns the run status of the current run', async () => {
    when(useRunStatus).calledWith(RUN_ID_2).thenReturn('running')
    const { result } = renderHook(useCurrentRunStatus)
    expect(result.current).toBe('running')
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
