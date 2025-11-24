import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { useNotifyRunQuery } from '/app/resources/runs'

import { useRunHasStarted } from '../useRunHasStarted'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'

vi.mock('../useNotifyRunQuery')

const MOCK_RUN_ID = '1'

describe('useRunHasStarted', () => {
  beforeEach(() => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(null)
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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(MOCK_RUN_ID)
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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(MOCK_RUN_ID)
      .thenReturn({ data: { data: runningRun } } as UseQueryResult<
        Run,
        unknown
      >)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(true)
  })
})
