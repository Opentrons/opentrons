import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'

import { useNotifyAllRunsQuery } from '../../../../resources/runs/useNotifyAllRunsQuery'
import { useMostRecentRunId } from '../useMostRecentRunId'

jest.mock('../../../../resources/runs/useNotifyAllRunsQuery')

const mockUseNotifyAllRunsQuery = useNotifyAllRunsQuery as jest.MockedFunction<
  typeof useNotifyAllRunsQuery
>

describe('useMostRecentRunId hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return the first run if any runs exist', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [{ id: 'some_run_id' }] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBe('some_run_id')
  })

  it('should return null if no runs exist', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
  it('should return null if no run data exists', async () => {
    when(mockUseNotifyAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: null } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
})
