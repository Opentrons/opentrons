import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { describe, it, afterEach, vi, expect } from 'vitest'

import { useNotifyAllRunsQuery } from '../useNotifyAllRunsQuery'
import { useMostRecentRunId } from '../useMostRecentRunId'

vi.mock('/app/resources/runs/useNotifyAllRunsQuery')

describe('useMostRecentRunId hook', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return the first run if any runs exist', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith()
      .thenReturn({ data: { data: [{ id: 'some_run_id' }] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBe('some_run_id')
  })

  it('should return null if no runs exist', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith()
      .thenReturn({ data: { data: [] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
  it('should return null if no run data exists', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith()
      .thenReturn({ data: { data: null } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
})
