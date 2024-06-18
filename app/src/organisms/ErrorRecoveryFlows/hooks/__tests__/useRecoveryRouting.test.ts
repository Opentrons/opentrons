import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useRecoveryRouting } from '../useRecoveryRouting'
import { RECOVERY_MAP } from '../../constants'

import type { IRecoveryMap } from '../../types'

describe('useRecoveryRouting', () => {
  it('should initialize with the default recovery map', () => {
    const { result } = renderHook(() => useRecoveryRouting())

    expect(result.current.recoveryMap).toEqual({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('should update the recovery map correctly', () => {
    const { result } = renderHook(() => useRecoveryRouting())

    const newRecoveryMap = {
      route: RECOVERY_MAP.BEFORE_BEGINNING.ROUTE,
      step: RECOVERY_MAP.BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION,
    } as IRecoveryMap

    act(() => {
      result.current.setRM(newRecoveryMap)
    })

    expect(result.current.recoveryMap).toEqual(newRecoveryMap)
  })
})
