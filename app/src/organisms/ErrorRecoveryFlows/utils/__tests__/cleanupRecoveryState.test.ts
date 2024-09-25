import { describe, it, expect, beforeEach, vi } from 'vitest'

import { cleanupRecoveryState } from '../cleanupRecoveryState'
import { RECOVERY_MAP } from '../../constants'

describe('cleanupRecoveryState', () => {
  let props: Parameters<typeof cleanupRecoveryState>[0]
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
    cleanupRecoveryState(props)

    expect(props.stashedMapRef.current).toEqual({
      route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.SKIP,
    })
    expect(mockSetRM).not.toHaveBeenCalled()
  })

  it('resets state when isTakeover is true', () => {
    props.isTakeover = true
    cleanupRecoveryState(props)

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('handles case when stashedMapRef.current is already null', () => {
    props.isTakeover = true
    props.stashedMapRef.current = null
    cleanupRecoveryState(props)

    expect(props.stashedMapRef.current).toBeNull()
    expect(mockSetRM).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })
})
