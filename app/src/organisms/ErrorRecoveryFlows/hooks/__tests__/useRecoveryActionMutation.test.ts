import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useRunActionMutations } from '@opentrons/react-api-client'

import { useRecoveryActionMutation } from '../useRecoveryActionMutation'

import type { Mock } from 'vitest'

vi.mock('@opentrons/react-api-client', () => ({
  useRunActionMutations: vi.fn(),
}))

describe('useRecoveryActionMutation', () => {
  const mockRunId = 'MOCK_ID'
  let mockPlayRun: Mock
  let mockIsPlayRunActionLoading: boolean

  beforeEach(() => {
    mockPlayRun = vi.fn()
    mockIsPlayRunActionLoading = false

    vi.mocked(useRunActionMutations).mockReturnValue({
      playRun: mockPlayRun,
      isPlayRunActionLoading: mockIsPlayRunActionLoading,
    } as any)
  })

  it('should return resumeRecovery and isResumeRecoveryLoading', () => {
    const { result } = renderHook(() => useRecoveryActionMutation(mockRunId))

    expect(result.current).toEqual({
      resumeRecovery: mockPlayRun,
      isResumeRecoveryLoading: mockIsPlayRunActionLoading,
    })
  })

  it('should return updated isResumeRecoveryLoading when it changes', () => {
    const { result, rerender } = renderHook(() =>
      useRecoveryActionMutation(mockRunId)
    )

    expect(result.current.isResumeRecoveryLoading).toBe(false)

    mockIsPlayRunActionLoading = true
    vi.mocked(useRunActionMutations).mockReturnValue({
      playRun: mockPlayRun,
      isPlayRunActionLoading: mockIsPlayRunActionLoading,
    } as any)

    rerender()

    expect(result.current.isResumeRecoveryLoading).toBe(true)
  })
})
