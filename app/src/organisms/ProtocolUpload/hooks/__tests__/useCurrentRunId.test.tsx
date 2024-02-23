import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'

import { useCurrentRunId } from '../useCurrentRunId'
import { useNotifyAllRunsQuery } from '../../../../resources/runs/useNotifyAllRunsQuery'

jest.mock('../../../../resources/runs/useNotifyAllRunsQuery')

const mockUseNotifyAllRunsQuery = useNotifyAllRunsQuery as jest.MockedFunction<
  typeof useNotifyAllRunsQuery
>

describe('useCurrentRunId hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return the run id specified in the current link', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith({ pageLength: 0 }, {})
      .mockReturnValue({
        data: { links: { current: { href: '/runs/run_id' } } },
      } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBe('run_id')
  })

  it('should return null if no current run link', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith({ pageLength: 0 }, {})
      .mockReturnValue({ data: { links: {} } } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBeNull()
  })

  it('should pass through runs query options', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith({ pageLength: 0 }, { enabled: true })
      .mockReturnValue({
        data: {
          links: { current: { href: '/runs/run_id' } },
        },
      } as any)

    const { result } = renderHook(() => useCurrentRunId({ enabled: true }))

    expect(result.current).toBe('run_id')
  })
})
