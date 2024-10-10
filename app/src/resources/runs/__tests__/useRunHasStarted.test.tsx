import { renderHook } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { useRunStatus } from '/app/resources/runs'
import { useRunHasStarted } from '../useRunHasStarted'

vi.mock('/app/resources/runs')

const MOCK_RUN_ID = '1'

describe('useRunHasStarted', () => {
  beforeEach(() => {
    when(vi.mocked(useRunStatus)).calledWith(null).thenReturn(null)
  })

  it('should return false when no run id is provided', () => {
    const { result } = renderHook(() => useRunHasStarted(null))
    expect(result.current).toEqual(false)
  })

  it('should return false when run has not started', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(MOCK_RUN_ID)
      .thenReturn(RUN_STATUS_IDLE)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(false)
  })

  it('should return true when run has started', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(MOCK_RUN_ID)
      .thenReturn(RUN_STATUS_RUNNING)
    const { result } = renderHook(() => useRunHasStarted(MOCK_RUN_ID))
    expect(result.current).toEqual(true)
  })
})
