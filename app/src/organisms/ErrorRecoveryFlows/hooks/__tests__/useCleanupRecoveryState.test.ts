import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useCleanupRecoveryState } from '../useCleanupRecoveryState'
import { RECOVERY_MAP } from '../../constants'

describe('useCleanupRecoveryState', () => {
  let props: Parameters<typeof useCleanupRecoveryState>[0]
  let mockSetRM: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSetRM = vi.fn()
    props = {
      isTakeover: false,
      stashedMapRef: {
        current: {
          route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
          step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.SKIP,
        },
      },
      setRM: mockSetRM,
    }
  })

  it('does not modify state when isTakeover is false', () => {
    renderHook(() => useCleanupRecoveryState(props))

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.SKIP,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })

  it('resets state when isTakeover is true', () => {
    props.isTakeover = true
    renderHook(() => useCleanupRecoveryState(props))

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('handles case when stashedMapRef.current is already null', () => {
    props.isTakeover = true
    props.stashedMapRef.current = null
    renderHook(() => useCleanupRecoveryState(props))

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('does not reset state when isTakeover changes from true to false', () => {
    const { rerender } = renderHook(
      ({ isTakeover }) => useCleanupRecoveryState({ ...props, isTakeover }),
      { initialProps: { isTakeover: true } }
    )

    mockSetRM.mockClear()
    props.stashedMapRef.current = {
      route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.SKIP,
    }

    rerender({ isTakeover: false })

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.SKIP,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })
})
