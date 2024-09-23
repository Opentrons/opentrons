import { describe, it, vi, beforeEach, expect } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'

import { useRunTimestamps } from '../useRunTimestamps'
import { useRunCommands } from '../useRunCommands'
import { useNotifyRunQuery } from '../useNotifyRunQuery'
import {
  RUN_ID_2,
  mockPausedRun,
  mockRunningRun,
  mockFailedRun,
  mockStoppedRun,
  mockSucceededRun,
  mockCommand,
} from '../__fixtures__'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

vi.mock('../useRunCommands')
vi.mock('../useNotifyRunQuery')

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
