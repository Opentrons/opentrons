import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RECOVERY_MAP } from '../../constants'
import { useCleanupRecoveryState } from '../useCleanupRecoveryState'

import type { IRecoveryMap } from '../../types'

describe('useCleanupRecoveryState', () => {
  let props: Parameters<typeof useCleanupRecoveryState>[0]
  let mockSetRM = vi.fn<(map: IRecoveryMap) => void>()

  beforeEach(() => {
    mockSetRM = vi.fn()
    props = {
      isActiveUser: false,
      stashedMapRef: {
        current: {
          route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
          step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS
            .RETRY_SAME_TIPS,
        },
      },
      setRM: mockSetRM,
    }
  })

  it('does not modify state when user was never active', () => {
    renderHook(() => useCleanupRecoveryState(props))

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })

  it('does not modify state when user becomes active', () => {
    props.isActiveUser = true

    renderHook(() => useCleanupRecoveryState(props))

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })

  it('resets state when user becomes inactive after being active', () => {
    const { rerender } = renderHook(
      ({ isActiveUser }) => useCleanupRecoveryState({ ...props, isActiveUser }),
      { initialProps: { isActiveUser: true } }
    )

    rerender({ isActiveUser: false })

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('handles case when stashedMapRef.current is already null', () => {
    const { rerender } = renderHook(
      ({ isActiveUser }) => useCleanupRecoveryState({ ...props, isActiveUser }),
      { initialProps: { isActiveUser: true } }
    )

    props.stashedMapRef.current = null
    rerender({ isActiveUser: false })

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('does not reset state on subsequent inactive states', () => {
    const { rerender } = renderHook(
      ({ isActiveUser }) => useCleanupRecoveryState({ ...props, isActiveUser }),
      { initialProps: { isActiveUser: true } }
    )

    rerender({ isActiveUser: false })
    mockSetRM.mockClear()

    props.stashedMapRef.current = {
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
    }

    rerender({ isActiveUser: false })

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })

  it('resets state only after a full active->inactive cycle', () => {
    const { rerender } = renderHook(
      ({ isActiveUser }) => useCleanupRecoveryState({ ...props, isActiveUser }),
      { initialProps: { isActiveUser: false } }
    )

    rerender({ isActiveUser: true })
    expect(mockSetRM).not.toHaveBeenCalled()
    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
    })

    rerender({ isActiveUser: false })
    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })
})
