import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useMostRecentRunId } from '../useMostRecentRunId'
import { useNotifyAllRunsQuery } from '../useNotifyAllRunsQuery'

vi.mock('/app/resources/runs/useNotifyAllRunsQuery')

describe('useMostRecentRunId hook', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return the first run if any runs exist', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 1 })
      .thenReturn({ data: { data: [{ id: 'some_run_id' }] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBe('some_run_id')
  })

  it('should return null if no runs exist', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 1 })
      .thenReturn({ data: { data: [] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
  it('should return null if no run data exists', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 1 })
      .thenReturn({ data: { data: null } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
})
