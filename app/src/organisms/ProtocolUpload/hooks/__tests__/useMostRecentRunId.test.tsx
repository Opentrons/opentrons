import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import { useMostRecentRunId } from '../useMostRecentRunId'

jest.mock('@opentrons/react-api-client')

const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>

describe('useMostRecentRunId hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return the first run if any runs exist', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [{ id: 'some_run_id' }] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBe('some_run_id')
  })

  it('should return null if no runs exist', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [] } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
  it('should return null if no run data exists', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: null } } as any)

    const { result } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
})
