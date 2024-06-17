import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useMostRecentCompletedAnalysis } from '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useRunningStepCounts } from '../useRunningStepCounts'
import { useLastRunCommandNoFixit } from '../useLastRunCommandNoFixit'

vi.mock('../useLastRunCommandNoFixit')
vi.mock(
  '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)

const mockRunId = 'mock-run-id'
const mockCommandsData = {
  data: [
    { id: 'cmd1', key: 'key1' },
    { id: 'cmd2', key: 'key2' },
  ],
  meta: { totalLength: 2 },
} as any

describe('useRunningStepCounts', () => {
  it('returns current step number and total step count for a deterministic run', () => {
    const mockAnalysis = {
      commands: [{ key: 'key1' }, { key: 'key2' }, { key: 'key3' }],
    } as any
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(mockAnalysis)
    vi.mocked(useLastRunCommandNoFixit).mockReturnValue({ key: 'key2' } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: 3,
      isDeterministicRun: true,
    })
  })

  it('returns current step number and null total step count for a non-deterministic run', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useLastRunCommandNoFixit).mockReturnValue(null)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: null,
      isDeterministicRun: false,
    })
  })

  it('returns null current step number and total step count when analysis and run command data are not available', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useLastRunCommandNoFixit).mockReturnValue(null)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, undefined)
    )

    expect(result.current).toEqual({
      currentStepNumber: null,
      totalStepCount: null,
      isDeterministicRun: false,
    })
  })
})
