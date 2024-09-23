import { describe, it, vi, expect } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { useRunStatus } from '../useRunStatus'
import { useNotifyRunQuery } from '../useNotifyRunQuery'
import {
  RUN_ID_2,
  mockRunningRun,
  mockIdleUnstartedRun,
  mockIdleStartedRun,
} from '../__fixtures__'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

vi.mock('../useNotifyRunQuery')

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
