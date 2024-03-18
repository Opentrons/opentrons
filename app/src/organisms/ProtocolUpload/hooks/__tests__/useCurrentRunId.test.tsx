import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { describe, it, afterEach, expect, vi } from 'vitest'

import { useCurrentRunId } from '../useCurrentRunId'
import { useNotifyAllRunsQuery } from '../../../../resources/runs'

vi.mock('../../../../resources/runs')

describe('useCurrentRunId hook', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return the run id specified in the current link', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 0 }, {})
      .thenReturn({
        data: { links: { current: { href: '/runs/run_id' } } },
      } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBe('run_id')
  })

  it('should return null if no current run link', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 0 }, {})
      .thenReturn({ data: { links: {} } } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBeNull()
  })

  it('should pass through runs query options', async () => {
    when(vi.mocked(useNotifyAllRunsQuery))
      .calledWith({ pageLength: 0 }, { enabled: true })
      .thenReturn({
        data: {
          links: { current: { href: '/runs/run_id' } },
        },
      } as any)

    const { result } = renderHook(() => useCurrentRunId({ enabled: true }))

    expect(result.current).toBe('run_id')
  })
})
