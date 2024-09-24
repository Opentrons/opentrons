import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { usePlayRunMutation } from '@opentrons/react-api-client'

import { useRecoveryActionMutation } from '../useRecoveryActionMutation'
import { RECOVERY_MAP } from '../../constants'

import type { Mock } from 'vitest'

vi.mock('@opentrons/react-api-client', () => ({
  usePlayRunMutation: vi.fn(),
}))

describe('useRecoveryActionMutation', () => {
  const mockRunId = 'MOCK_ID'
  let mockMutateAsync: Mock
  let mockIsLoading: boolean
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockMutateAsync = vi.fn()
    mockIsLoading = false
    mockProceedToRouteAndStep = vi.fn().mockResolvedValue(undefined)

    vi.mocked(usePlayRunMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: mockIsLoading,
    } as any)
  })

  it('should return resumeRecovery and isResumeRecoveryLoading', () => {
    const { result } = renderHook(() =>
      useRecoveryActionMutation(mockRunId, {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any)
    )

    expect(result.current).toHaveProperty('resumeRecovery')
    expect(result.current).toHaveProperty('isResumeRecoveryLoading')
    expect(result.current.isResumeRecoveryLoading).toBe(false)
  })

  it('should return updated isResumeRecoveryLoading when it changes', () => {
    const { result, rerender } = renderHook(() =>
      useRecoveryActionMutation(mockRunId, {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any)
    )

    expect(result.current.isResumeRecoveryLoading).toBe(false)

    mockIsLoading = true
    vi.mocked(usePlayRunMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: mockIsLoading,
    } as any)

    rerender()

    expect(result.current.isResumeRecoveryLoading).toBe(true)
  })

  it('should call mutateAsync with runId when resumeRecovery is called', async () => {
    const { result } = renderHook(() =>
      useRecoveryActionMutation(mockRunId, {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any)
    )

    mockMutateAsync.mockResolvedValue('MOCK_RESULT')

    await result.current.resumeRecovery()

    expect(mockMutateAsync).toHaveBeenCalledWith(mockRunId)
  })

  it('should handle error and proceed to error route when resumeRecovery fails', async () => {
    const { result } = renderHook(() =>
      useRecoveryActionMutation(mockRunId, {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any)
    )

    mockMutateAsync.mockRejectedValue(new Error('MOCK_ERROR'))

    await expect(result.current.resumeRecovery()).rejects.toThrow(
      'Could not resume recovery: Error: MOCK_ERROR'
    )

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
    )
  })
})
