import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCurrentRunId } from '../useCurrentRunId'
import { useNotifyAllRunsQuery } from '../useNotifyAllRunsQuery'

vi.mock('../useNotifyAllRunsQuery')

describe('useCurrentRunId hook', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return the run id specified in the current link', async () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { links: { current: { href: '/runs/run_id' } } },
    } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBe('run_id')
    expect(useNotifyAllRunsQuery).toHaveBeenCalledWith(
      { pageLength: 0 },
      {},
      undefined
    )
  })

  it('should return null if no current run link', async () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { links: {} },
    } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBeNull()
  })

  it('should pass through runs query options', async () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: { current: { href: '/runs/run_id' } },
      },
    } as any)

    const { result } = renderHook(() => useCurrentRunId({ enabled: true }))

    expect(result.current).toBe('run_id')
    expect(useNotifyAllRunsQuery).toHaveBeenCalledWith(
      { pageLength: 0 },
      { enabled: true },
      undefined
    )
  })
})
