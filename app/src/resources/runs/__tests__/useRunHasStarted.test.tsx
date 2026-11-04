import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { useRunHasStarted } from '../useRunHasStarted'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

vi.mock('../useNotifyRunQuery')

const MOCK_RUN_ID = '1'

describe('useRunHasStarted', () => {
  beforeEach(() => {
    vi.when(vi.mocked(useNotifyRunQuery))
      .calledWith(null, { refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL })
      .thenReturn({ data: null } as any)
  })

  it('should return false when no run id is provided', () => {
    const { result } = renderHook(() => useRunHasStarted(null))

    expect(result.current).toEqual(false)
  })

  it('should return false when run has not started', () => {
    const idleRun = {
      current: true,
      id: MOCK_RUN_ID,
      status: RUN_STATUS_IDLE,
    }
    vi.when(vi.mocked(useNotifyRunQuery))
      .calledWith(MOCK_RUN_ID, {
        refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
      })
      .thenReturn({ data: { data: idleRun } } as UseQueryResult<Run, unknown>)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(false)
  })

  it('should return true when run has started', () => {
    const runningRun = {
      current: true,
      id: MOCK_RUN_ID,
      status: RUN_STATUS_RUNNING,
    }
    vi.when(vi.mocked(useNotifyRunQuery))
      .calledWith(MOCK_RUN_ID, {
        refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
      })
      .thenReturn({ data: { data: runningRun } } as UseQueryResult<
        Run,
        unknown
      >)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(true)
  })
})
