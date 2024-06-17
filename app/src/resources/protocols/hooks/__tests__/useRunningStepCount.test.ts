import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useCommandQuery } from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useRunningStepCounts } from '../useRunningStepCounts'

vi.mock('@opentrons/react-api-client', async () => {
  const actual = await vi.importActual('@opentrons/react-api-client')
  return {
    ...actual,
    useCommandQuery: vi.fn(),
  }
})
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
}

describe('useRunningStepCounts', () => {
  it('returns current step number and total step count for a deterministic run', () => {
    const mockAnalysis = {
      commands: [{ key: 'key1' }, { key: 'key2' }, { key: 'key3' }],
    }
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(
      mockAnalysis as any
    )
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData as any)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: 3,
      isDeterministicRun: true,
      lastRunCommandNoFixit: { id: 'cmd2', key: 'key2' },
    })
  })

  it('returns current step number and null total step count for a non-deterministic run', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, mockCommandsData as any)
    )

    expect(result.current).toEqual({
      currentStepNumber: 2,
      totalStepCount: null,
      isDeterministicRun: false,
      lastRunCommandNoFixit: { id: 'cmd2', key: 'key2' },
    })
  })

  it('returns null current step number and total step count when analysis and run command data are not available', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, undefined)
    )

    expect(result.current).toEqual({
      currentStepNumber: null,
      totalStepCount: null,
      isDeterministicRun: false,
      lastRunCommandNoFixit: null,
    })
  })

  it('returns the failed command as lastRunCommandNoFixit when the last run command is a fixit command', () => {
    const mockFixitCommand = {
      id: 'fixit-cmd',
      intent: 'fixit',
      failedCommandId: 'failed-cmd-id',
    }
    const mockFailedCommand = { id: 'failed-cmd-id', key: 'failed-key' }
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: mockFailedCommand },
    } as any)

    const { result } = renderHook(() =>
      useRunningStepCounts(mockRunId, {
        data: [mockFixitCommand],
        meta: { totalLength: 1 },
      } as any)
    )

    expect(result.current).toEqual({
      currentStepNumber: 1,
      totalStepCount: null,
      isDeterministicRun: false,
      lastRunCommandNoFixit: mockFailedCommand,
    })
  })
})
