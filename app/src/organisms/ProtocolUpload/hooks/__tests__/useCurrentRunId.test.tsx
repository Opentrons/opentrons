import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../useCurrentRunId'

jest.mock('@opentrons/react-api-client')

const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>

describe('useCurrentRunId hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return the run id specified in the current link', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({
        data: { links: { current: { href: '/runs/run_id' } } },
      } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBe('run_id')
  })

  it('should return null if no current run link', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({ data: { links: {} } } as any)

    const { result } = renderHook(useCurrentRunId)

    expect(result.current).toBeNull()
  })
})
