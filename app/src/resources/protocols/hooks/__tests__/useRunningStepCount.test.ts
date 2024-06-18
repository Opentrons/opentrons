import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useMostRecentCompletedAnalysis } from '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useRunningStepCounts } from '../useRunningStepCounts'
import { useLastRunProtocolCommand } from '../useLastRunProtocolCommand'

vi.mock('../useLastRunProtocolCommand')
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
    vi.mocked(useLastRunProtocolCommand).mockReturnValue({ key: 'key2' } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: 3,
      hasRunDiverged: false,
    })
  })

  it('returns current step number and null total step count for a non-deterministic run', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useLastRunProtocolCommand).mockReturnValue(null)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: null,
      hasRunDiverged: true,
    })
  })

  it('returns null current step number and total step count when analysis and run command data are not available', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useLastRunProtocolCommand).mockReturnValue(null)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, undefined)
    )

    expect(result.current).toEqual({
      currentStepNumber: null,
      totalStepCount: null,
      hasRunDiverged: true,
    })
  })
})
